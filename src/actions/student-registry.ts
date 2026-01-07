"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { StudentRegistryModel, StudentModel, TeamModel } from "@/lib/models";
import { StudentRegistry } from "@/lib/types";

export async function getRegisteredStudentCount() {
    await connectDB();
    return await StudentModel.countDocuments();
}

export async function getRegisteredStudents() {
    await connectDB();
    // Sort by badge_uid as requested
    const students = await StudentModel.find().sort({ badge_uid: 1 }).lean();
    return JSON.parse(JSON.stringify(students));
}

export async function getTeamsShort() {
    await connectDB();
    const teams = await TeamModel.find({}, { id: 1, name: 1 }).lean();
    return JSON.parse(JSON.stringify(teams));
}

export async function getStudentRegistry(): Promise<StudentRegistry[]> {
    await connectDB();
    const students = await StudentRegistryModel.find().sort({ uid: 1 }).lean();
    return JSON.parse(JSON.stringify(students));
}

export async function addStudentToRegistry(data: { uid: string; name: string }) {
    await connectDB();
    await StudentRegistryModel.create(data);
    revalidatePath("/admin/student-registry");
}

export async function updateStudentInRegistry(id: string, data: { uid: string; name: string }) {
    await connectDB();
    await StudentRegistryModel.findByIdAndUpdate(id, data);
    revalidatePath("/admin/student-registry");
}

export async function deleteStudentFromRegistry(id: string) {
    await connectDB();
    await StudentRegistryModel.findByIdAndDelete(id);
    revalidatePath("/admin/student-registry");
}

/**
 * Bulk import students from CSV data (parsed on client)
 */
export async function bulkImportToRegistry(students: { uid: string; name: string }[]) {
    await connectDB();

    // To avoid duplicates, we can use a loop or bulkWrite
    // For simplicity and safety, we'll check each or clear and refill if that's the intent
    // Here we'll just insert non-duplicates
    for (const student of students) {
        await StudentRegistryModel.findOneAndUpdate(
            { uid: student.uid },
            { name: student.name },
            { upsert: true, new: true }
        );
    }

    revalidatePath("/admin/student-registry");
}
