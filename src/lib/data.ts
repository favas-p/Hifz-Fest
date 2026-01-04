import { randomUUID } from "node:crypto";
import { hash } from "bcryptjs";
import type {
  AssignedProgram,

  Jury,
  GradeType,
  LiveScore,
  Program,
  ResultRecord,
  SectionType,
  Student,
  Team,
} from "./types";
import { connectDB } from "./db";
import {
  ApprovedResultModel,
  AssignedProgramModel,
  JuryModel,
  LiveScoreModel,
  PendingResultModel,
  ProgramModel,
  StudentModel,
  TeamModel,
} from "./models";

let seedPromise: Promise<void> | null = null;

async function seedCollection(
  count: number,
  insertFn: () => Promise<void>, // Typed clearly
): Promise<void> {
  if (count === 0) {
    await insertFn();
  }
}

async function updateTeamNames() {
  await connectDB();
  // Update existing teams with new names and colors from defaultTeams
  // NOTE: This does NOT update passwords to avoid overwriting user-changed passwords with defaults
  for (const team of defaultTeams) {
    await TeamModel.updateOne(
      { id: team.id },
      { $set: { name: team.name, color: team.color } },
      { upsert: false }
    );
  }
}

async function seedDatabase() {
  await connectDB();

  const [teamCount, studentCount, programCount, juryCount, liveScoreCount, assignmentCount] =
    await Promise.all([
      TeamModel.countDocuments(),
      StudentModel.countDocuments(),
      ProgramModel.countDocuments(),
      JuryModel.countDocuments(),
      LiveScoreModel.countDocuments(),
      AssignedProgramModel.countDocuments(),
    ]);

  // Always update team names to ensure they match the current defaults
  await updateTeamNames();

  await seedCollection(teamCount, async () => {
    // Hash passwords before seeding
    const teamsToInsert = await Promise.all(
      defaultTeams.map(async (t) => ({
        ...t,
        portal_password: await hash(t.portal_password || "", 10),
      }))
    );
    await TeamModel.insertMany(teamsToInsert);
  });

  await seedCollection(liveScoreCount, async () => {
    await LiveScoreModel.insertMany(
      defaultTeams.map((team) => ({
        team_id: team.id,
        total_points: team.total_points,
      })),
    );
  });

  await seedCollection(studentCount, async () => {
    await StudentModel.insertMany(defaultStudents);
  });

  await seedCollection(programCount, async () => {
    await ProgramModel.insertMany(defaultPrograms);
  });

  await seedCollection(juryCount, async () => {
    // Hash passwords before seeding
    const juriesToInsert = await Promise.all(
      defaultJury.map(async (j) => ({
        ...j,
        password: await hash(j.password, 10),
      }))
    );
    await JuryModel.insertMany(juriesToInsert);
  });

  await seedCollection(assignmentCount, async () => {
    await AssignedProgramModel.insertMany(defaultAssignments);
  });
}

async function ensureSeedData() {
  if (!seedPromise) {
    seedPromise = seedDatabase();
  }
  await seedPromise;
}

function normalize<T>(docs: T[]): T[] {
  return docs.map((doc) => JSON.parse(JSON.stringify(doc)));
}

export async function getTeams(): Promise<Team[]> {
  await ensureSeedData();
  const teams = await TeamModel.find().lean<Team[]>();
  const normalized = normalize(teams);
  // SECURITY: Strip passwords from output
  return normalized.map(t => {
    const { portal_password, ...rest } = t;
    return { ...rest, portal_password: "" } as Team;
  });
}

export async function getLiveScores(): Promise<LiveScore[]> {
  await ensureSeedData();
  const scores = await LiveScoreModel.find().lean<LiveScore[]>();
  return normalize(scores);
}

export async function getStudents(): Promise<Student[]> {
  await ensureSeedData();
  const students = await StudentModel.find().lean<Student[]>();
  return normalize(students);
}

export async function getPrograms(): Promise<Program[]> {
  await ensureSeedData();
  const programs = await ProgramModel.find().lean<Program[]>();
  return normalize(programs);
}

export async function getJuries(): Promise<Jury[]> {
  await ensureSeedData();
  const juries = await JuryModel.find().lean<Jury[]>();
  const normalized = normalize(juries);

  // Ensure all juries have an avatar - assign and persist if missing (only once)
  // Once set, avatar is never changed
  const juriesWithAvatars = await Promise.all(
    normalized.map(async (jury) => {
      const updatedJury = { ...jury };

      if (!jury.avatar) {
        // Assign random avatar only if missing - this will be saved permanently
        const avatar = getRandomJuryAvatar();
        await connectDB();
        await JuryModel.updateOne({ id: jury.id }, { $set: { avatar } });
        updatedJury.avatar = avatar;
      }

      // SECURITY: Strip passwords
      updatedJury.password = "";
      return updatedJury;
    })
  );

  return juriesWithAvatars;
}

export async function getAssignments(): Promise<AssignedProgram[]> {
  await ensureSeedData();
  const assignments = await AssignedProgramModel.find().lean<AssignedProgram[]>();
  return normalize(assignments);
}

export async function getPendingResults(): Promise<ResultRecord[]> {
  await ensureSeedData();
  const results = await PendingResultModel.find().lean<ResultRecord[]>();
  return normalize(results);
}

export async function getApprovedResults(): Promise<ResultRecord[]> {
  await ensureSeedData();
  const results = await ApprovedResultModel.find().lean<ResultRecord[]>();
  return normalize(results);
}

/**
 * Check if a program result is already approved/published
 * @param programId - The program ID to check
 * @returns true if the program has an approved result, false otherwise
 */
export async function isProgramResultApproved(programId: string): Promise<boolean> {
  await ensureSeedData();
  const approvedResult = await ApprovedResultModel.findOne({ program_id: programId }).lean();
  return !!approvedResult;
}

export async function getPendingResultById(
  id: string,
): Promise<ResultRecord | null> {
  await ensureSeedData();
  const result = await PendingResultModel.findOne({ id }).lean<ResultRecord | null>();
  return result ? JSON.parse(JSON.stringify(result)) : null;
}

export async function getApprovedResultById(
  id: string,
): Promise<ResultRecord | null> {
  await ensureSeedData();
  const result = await ApprovedResultModel.findOne({ id }).lean<ResultRecord | null>();
  return result ? JSON.parse(JSON.stringify(result)) : null;
}

export async function createProgram(input: Omit<Program, "id">): Promise<Program> {
  await connectDB();
  const created = await ProgramModel.create({ ...input, id: randomUUID() });
  return JSON.parse(JSON.stringify(created)) as Program;
}

export async function updateProgramById(
  id: string,
  data: Partial<Omit<Program, "id">>,
) {
  await connectDB();
  await ProgramModel.updateOne({ id }, data);
}

export async function deleteProgramById(id: string) {
  await connectDB();
  await ProgramModel.deleteOne({ id });
}

export async function createStudent(input: Omit<Student, "id" | "total_points">) {
  await connectDB();

  // Normalize chest number to uppercase for consistent comparison
  const normalizedChestNo = input.chest_no.trim().toUpperCase();

  // Check for duplicate chest number
  const existing = await StudentModel.findOne({
    chest_no: normalizedChestNo
  }).lean();

  if (existing) {
    throw new Error(`Chest number "${input.chest_no}" is already registered to student "${existing.name}".`);
  }

  // Check for duplicate badge_uid if provided
  if (input.badge_uid) {
    const badgeDuplicate = await StudentModel.findOne({
      badge_uid: input.badge_uid
    }).lean();

    if (badgeDuplicate) {
      throw new Error(`Badge UID "${input.badge_uid}" is already assigned to student "${badgeDuplicate.name}".`);
    }
  }

  try {
    const studentId = randomUUID();
    const studentData: any = {
      ...input,
      chest_no: normalizedChestNo,
      id: studentId,
      total_points: 0,
    };

    if (input.badge_uid) {
      studentData.badge_uid = input.badge_uid;
    } else {
      delete studentData.badge_uid;
    }

    await StudentModel.create(studentData);

    // Emit real-time event
    const { emitStudentCreated } = await import("./pusher");
    await emitStudentCreated(studentId, input.team_id);
  } catch (error: any) {
    // Handle MongoDB duplicate key error (code 11000)
    if (error.code === 11000) {
      throw new Error(`Chest number "${input.chest_no}" is already registered.`);
    }
    throw error;
  }
}

export async function updateStudentById(
  id: string,
  data: Partial<Omit<Student, "id">>,
) {
  await connectDB();

  // If chest_no is being updated, check for duplicates
  if (data.chest_no) {
    const normalizedChestNo = data.chest_no.trim().toUpperCase();

    // Check for duplicate chest number (excluding current student)
    const existing = await StudentModel.findOne({
      chest_no: normalizedChestNo,
      id: { $ne: id }
    }).lean();

    if (existing) {
      throw new Error(`Chest number "${data.chest_no}" is already registered to student "${existing.name}".`);
    }

    // If badge_uid is being updated, check for duplicates
    if (data.badge_uid) {
      const existingBadge = await StudentModel.findOne({
        badge_uid: data.badge_uid,
        id: { $ne: id }
      }).lean();

      if (existingBadge) {
        throw new Error(`Badge UID "${data.badge_uid}" is already assigned to student "${existingBadge.name}".`);
      }
    }

    // Normalize the chest number in the update data
    data.chest_no = normalizedChestNo;
  }

  try {
    // Get team_id before update
    const student = await StudentModel.findOne({ id }).lean();
    const teamId = student?.team_id || data.team_id || "";

    const updateOperation: any = { $set: { ...data } };

    // Handle badge_uid unsetting
    // If badge_uid is explicitly passed as empty string, unset it.
    // If it is passed as a valid string, it is already in $set.
    // If it is undefined, it is not in data (Partial), so nothing happens (which is correct for partial update).
    // BUT we need to establish convention: Empty string "" means remove.
    if ('badge_uid' in data) {
      if (!data.badge_uid) {
        // If empty string or null/false, unset it
        delete updateOperation.$set.badge_uid;
        updateOperation.$unset = { badge_uid: "" };
      }
    }

    await StudentModel.updateOne({ id }, updateOperation);

    // Emit real-time event
    if (teamId) {
      const { emitStudentUpdated } = await import("./pusher");
      await emitStudentUpdated(id, teamId);
    }
  } catch (error: any) {
    // Handle MongoDB duplicate key error (code 11000)
    if (error.code === 11000) {
      throw new Error(`Chest number "${data.chest_no}" is already registered.`);
    }
    throw error;
  }
}

export async function deleteStudentById(id: string) {
  await connectDB();
  const student = await StudentModel.findOne({ id }).lean();
  await StudentModel.deleteOne({ id });

  // Emit real-time event
  if (student?.team_id) {
    const { emitStudentDeleted } = await import("./pusher");
    await emitStudentDeleted(id, student.team_id);
  }
}

// Available jury avatar images
const JURY_AVATARS = [
  "/img/jury.webp",
  "/img/jury1.webp",
  "/img/jury2.webp",
  "/img/jury3.webp",
  "/img/jury4.webp",
];

function getRandomJuryAvatar(): string {
  return JURY_AVATARS[Math.floor(Math.random() * JURY_AVATARS.length)];
}

export async function createJury(input: Omit<Jury, "id">) {
  await connectDB();
  // Assign random avatar if not provided - once set, it never changes
  const avatar = input.avatar || getRandomJuryAvatar();

  // Hash password
  const hashedPassword = await hash(input.password, 10);

  await JuryModel.create({
    ...input,
    id: `jury-${randomUUID().slice(0, 8)}`,
    password: hashedPassword,
    avatar, // Avatar is set once at creation and never changes
  });
}

export async function updateJuryById(id: string, data: Partial<Omit<Jury, "id">>) {
  await connectDB();
  // Explicitly exclude avatar from updates - avatars are immutable once set
  const { avatar, password, ...updateData } = data;

  const updatePayload: any = { ...updateData };
  if (password) {
    updatePayload.password = await hash(password, 10);
  }

  await JuryModel.updateOne({ id }, updatePayload);
}

export async function deleteJuryById(id: string) {
  await connectDB();
  await JuryModel.deleteOne({ id });
}

export async function getOrCreateAdminJury(): Promise<Jury> {
  await connectDB();
  const adminJuryId = "jury-admin";

  let adminJury = await JuryModel.findOne({ id: adminJuryId }).lean<Jury>().exec();

  if (!adminJury) {
    const hashedPassword = await hash("admin@jury", 10);
    await JuryModel.create({
      id: adminJuryId,
      name: "Admin",
      password: hashedPassword,
      avatar: "/img/jury.webp",
    });

    adminJury = await JuryModel.findOne({ id: adminJuryId }).lean<Jury>().exec();
  }

  // SECURITY: Strip password
  return { ...adminJury!, password: "" };
}

export async function assignProgramToJury(programId: string, juryId: string) {
  await connectDB();

  // Check if program is already approved/published
  const approvedResult = await ApprovedResultModel.findOne({ program_id: programId }).lean();
  if (approvedResult) {
    throw new Error("This program is already published. Cannot assign published programs to juries.");
  }

  // Check if assignment already exists
  const existing = await AssignedProgramModel.findOne({
    program_id: programId,
    jury_id: juryId,
  }).lean();

  if (existing) {
    // Assignment already exists - update status to pending if needed
    if (existing.status !== "pending") {
      await AssignedProgramModel.updateOne(
        { program_id: programId, jury_id: juryId },
        { status: "pending" },
      );
    }
    // Silently succeed if already assigned (idempotent operation)
    return;
  }

  try {
    await AssignedProgramModel.updateOne(
      { program_id: programId, jury_id: juryId },
      { program_id: programId, jury_id: juryId, status: "pending" },
      { upsert: true },
    );

    // Emit real-time event only if assignment was newly created
    if (!existing) {
      const { emitAssignmentCreated } = await import("./pusher");
      await emitAssignmentCreated(programId, juryId);
    }
  } catch (error: any) {
    // Handle MongoDB duplicate key error (code 11000) for program_id + jury_id unique index
    if (error.code === 11000 && error.keyPattern?.program_id && error.keyPattern?.jury_id) {
      throw new Error(`Program is already assigned to this jury.`);
    }
    throw error;
  }
}

export async function updateAssignmentStatus(
  programId: string,
  juryId: string,
  status: AssignedProgram["status"],
) {
  await connectDB();
  await AssignedProgramModel.updateOne({ program_id: programId, jury_id: juryId }, { status });
}

export async function deleteAssignment(programId: string, juryId: string) {
  await connectDB();
  await AssignedProgramModel.deleteOne({ program_id: programId, jury_id: juryId });

  // Emit real-time event
  const { emitAssignmentDeleted } = await import("./pusher");
  await emitAssignmentDeleted(programId, juryId);
}



const GRADE_BONUS: Record<Exclude<GradeType, "none">, number> = {
  A: 5,
  B: 3,
  C: 1,
};

const GROUP_SCORES: Record<1 | 2 | 3, number> = {
  1: 10,
  2: 8,
  3: 6,
};


// Update calculateScore to accept type instead of section
export function calculateScore(
  type: "single" | "group",
  position: 1 | 2 | 3,
  grade: GradeType = "none",
): number {
  if (type === "single") {
    // Individual events: 5, 3, 1 + Grade Bonus
    const base = [0, 5, 3, 1][position] || 0;
    const bonus = grade !== "none" ? GRADE_BONUS[grade] : 0;
    return base + bonus;
  }

  // Group events: 10, 8, 6 + Grade Bonus
  const base = GROUP_SCORES[position] || 0;
  const bonus = grade !== "none" ? GRADE_BONUS[grade] : 0;
  return base + bonus;
}

export async function updateLiveScore(teamId: string, delta: number) {
  await connectDB();
  await LiveScoreModel.updateOne(
    { team_id: teamId },
    { $inc: { total_points: delta } },
    { upsert: true },
  );
  await updateTeamTotals(teamId, delta);
}

export async function updateStudentScore(studentId: string, delta: number) {
  await connectDB();
  await StudentModel.updateOne(
    { id: studentId },
    { $inc: { total_points: delta } },
    { upsert: false },
  );
}

async function updateTeamTotals(teamId: string, delta: number) {
  await connectDB();
  await TeamModel.updateOne({ id: teamId }, { $inc: { total_points: delta } });
}

export async function resetLiveScores() {
  await connectDB();
  await Promise.all([
    LiveScoreModel.updateMany({}, { $set: { total_points: 0 } }),
    TeamModel.updateMany({}, { $set: { total_points: 0 } }),
    StudentModel.updateMany({}, { $set: { total_points: 0 } }),
  ]);
}

const defaultTeams: Team[] = [
  // Legacy teams disabled for public registration system
  // {
  //   id: "team-cosmos",
  //   name: "SAMARQAND",
  //   leader: "Mira Lopes",
  //   leader_photo: "https://images.unsplash.com/photo-1544723795-3fb6469f5b39",
  //   color: "#D72638",
  //   description: "Fine arts and installations with a cosmic narrative.",
  //   contact: "cosmos@artsfest.edu",
  //   total_points: 0,
  //   portal_password: "cosmos@123",
  // },
];

const defaultStudents: Student[] = [

];

const defaultPrograms: Program[] = [

];

const defaultAssignments: AssignedProgram[] = [

];

const defaultJury: Jury[] = [

];
