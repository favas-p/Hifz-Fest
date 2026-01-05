"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentTeam } from "@/lib/auth";
import {
    deletePortalStudent,
    getPortalStudents,
    upsertPortalStudent,
    isRegistrationOpen,
} from "@/lib/team-data";
import { findParticipantByUid } from "@/lib/allowed-participants";

function redirectWithMessage(message: string, type: "error" | "success" = "error") {
    const params = new URLSearchParams({ [type]: message });
    redirect(`/team/register-students?${params.toString()}`);
}

function generateNextChestNumber(teamName: string, existingStudents: Array<{ chestNumber: string }>): string {
    const prefix = teamName.slice(0, 2).toUpperCase();
    const teamStudents = existingStudents.filter((student) => {
        const chest = student.chestNumber.toUpperCase();
        return chest.startsWith(prefix) && /^\d{3}$/.test(chest.slice(2));
    });

    if (teamStudents.length === 0) {
        return `${prefix}001`;
    }

    const numbers = teamStudents
        .map((student) => {
            const numStr = student.chestNumber.toUpperCase().slice(2);
            const num = parseInt(numStr, 10);
            return isNaN(num) ? 0 : num;
        })
        .filter((num) => num > 0);

    const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
    const nextNumber = maxNumber + 1;
    return `${prefix}${String(nextNumber).padStart(3, "0")}`;
}

export async function createStudentAction(formData: FormData) {
    const team = await getCurrentTeam();
    if (!team) redirect("/team/login");

    const isOpen = await isRegistrationOpen();
    if (!isOpen) {
        redirectWithMessage("Registration window is closed. You cannot add students at this time.");
        // Note: redirectWithMessage throws, but we add return for TS flow analysis or in case we change implementation
        return;
    }

    const name = String(formData.get("name") ?? "").trim();
    const category = String(formData.get("category") ?? "") as "junior" | "senior";
    const badge_uid = String(formData.get("badge_uid") ?? "").trim();

    // Validate inputs
    if (!badge_uid) {
        redirectWithMessage("UID is required.");
        return;
    }

    // Validate against allowed participants CSV
    const participant = await findParticipantByUid(badge_uid);
    if (!participant) {
        redirectWithMessage(`UID "${badge_uid}" is not in the allowed participants list.`);
        return;
    }

    const officialName = participant.name;

    if (!category || (category !== "junior" && category !== "senior")) {
        redirectWithMessage("Valid category (Junior/Senior) is required.");
        return;
    }

    const students = await getPortalStudents();

    // Check if UID is already registered by ANYONE (globally unique)
    if (students.some(s => s.badge_uid === badge_uid)) {
        redirectWithMessage("This UID is already registered.");
        return;
    }

    const chestNumber = generateNextChestNumber(team.teamName, students);

    if (students.some((student) => student.chestNumber.toUpperCase() === chestNumber)) {
        redirectWithMessage("Chest number already registered.");
        return;
    }

    // Also check if name already exists in team (optional, but good practice)
    if (
        students.some(
            (student) =>
                student.teamId === team.id && student.name.toLowerCase() === officialName.toLowerCase(),
        )
    ) {
        redirectWithMessage("Student name already exists for this team.");
        return;
    }

    try {
        await upsertPortalStudent({
            name: officialName, // Use official name from CSV
            chestNumber,
            teamId: team.id,
            category,
            badge_uid,
        });
    } catch (error) {
        redirectWithMessage((error as Error).message);
        return;
    }
    revalidatePath("/team/register-students");
    redirectWithMessage("Student added successfully.", "success");
}

export async function updateStudentAction(formData: FormData) {
    const team = await getCurrentTeam();
    if (!team) redirect("/team/login");

    const isOpen = await isRegistrationOpen();
    if (!isOpen) {
        redirectWithMessage("Registration window is closed. You cannot edit students at this time.");
        return;
    }

    const studentId = String(formData.get("studentId") ?? "");
    const name = String(formData.get("name") ?? "").trim();
    const category = String(formData.get("category") ?? "") as "junior" | "senior";
    const chestNumber = String(formData.get("chestNumber") ?? "").trim().toUpperCase();
    const badge_uid = String(formData.get("badge_uid") ?? "").trim();

    if (!studentId) { redirectWithMessage("Missing student ID."); return; }
    if (!name) { redirectWithMessage("Student name is required."); return; }
    if (!category || (category !== "junior" && category !== "senior")) {
        redirectWithMessage("Valid category (Junior/Senior) is required.");
        return;
    }

    let officialName = name;
    if (badge_uid) {
        const participant = await findParticipantByUid(badge_uid);
        if (!participant) {
            redirectWithMessage(`UID "${badge_uid}" is not in the allowed participants list.`);
            return;
        }
        officialName = participant.name;
    }

    const students = await getPortalStudents();
    const current = students.find((student) => student.id === studentId);
    if (!current || current.teamId !== team.id) {
        redirectWithMessage("You can only edit your own students.");
        return;
    }
    if (students.some((student) => student.id !== studentId && student.chestNumber === chestNumber)) {
        redirectWithMessage("Chest number already registered.");
        return;
    }

    if (badge_uid && students.some(s => s.id !== studentId && s.badge_uid === badge_uid)) {
        redirectWithMessage("This UID is already assigned to another student.");
        return;
    }

    try {
        await upsertPortalStudent({
            id: studentId,
            name: officialName,
            chestNumber,
            teamId: team.id,
            category,
            badge_uid: badge_uid || undefined,
        });
    } catch (error) {
        redirectWithMessage((error as Error).message);
        return;
    }
    revalidatePath("/team/register-students");
    redirectWithMessage("Student updated.", "success");
}

export async function deleteStudentAction(formData: FormData) {
    const team = await getCurrentTeam();
    if (!team) redirect("/team/login");

    const isOpen = await isRegistrationOpen();
    if (!isOpen) {
        redirectWithMessage("Registration window is closed. You cannot delete students at this time.");
        return;
    }

    const studentId = String(formData.get("studentId") ?? "");
    const students = await getPortalStudents();
    const current = students.find((student) => student.id === studentId);
    if (!current || current.teamId !== team.id) {
        redirectWithMessage("Cannot delete student outside your team.");
        return;
    }
    await deletePortalStudent(studentId);
    revalidatePath("/team/register-students");
    redirectWithMessage("Student deleted.", "success");
}
