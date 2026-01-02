"use server";

import { connectDB } from "@/lib/db";
import {
    TeamModel,
    StudentModel,
    ProgramModel,
    JuryModel,
    AssignedProgramModel,
    ProgramRegistrationModel,
    RegistrationScheduleModel,
    PendingResultModel,
    ApprovedResultModel,
    LiveScoreModel,
    ReplacementRequestModel,
    NotificationModel,
    AdminSettingsModel,
} from "@/lib/models";
import { isAdminAuthenticated } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getDatabaseStats() {
    if (!(await isAdminAuthenticated())) {
        throw new Error("Unauthorized");
    }

    await connectDB();

    return {
        teams: await TeamModel.countDocuments(),
        students: await StudentModel.countDocuments(),
        programs: await ProgramModel.countDocuments(),
        juries: await JuryModel.countDocuments(),
        assignedPrograms: await AssignedProgramModel.countDocuments(),
        programRegistrations: await ProgramRegistrationModel.countDocuments(),
        registrationSchedules: await RegistrationScheduleModel.countDocuments(),
        pendingResults: await PendingResultModel.countDocuments(),
        approvedResults: await ApprovedResultModel.countDocuments(),
        liveScores: await LiveScoreModel.countDocuments(),
        replacementRequests: await ReplacementRequestModel.countDocuments(),
        notifications: await NotificationModel.countDocuments(),
    };
}

export async function restoreDatabase(data: any) {
    if (!(await isAdminAuthenticated())) {
        throw new Error("Unauthorized");
    }

    if (!data || typeof data !== "object") {
        throw new Error("Invalid backup file format");
    }

    await connectDB();

    // Helper to clear and insert
    const restoreCollection = async (model: any, items: any[]) => {
        if (Array.isArray(items)) {
            await model.deleteMany({});
            if (items.length > 0) {
                await model.insertMany(items);
            }
        }
    };

    try {
        await restoreCollection(TeamModel, data.teams);
        await restoreCollection(StudentModel, data.students);
        await restoreCollection(ProgramModel, data.programs);
        await restoreCollection(JuryModel, data.juries);
        await restoreCollection(AssignedProgramModel, data.assignedPrograms);
        await restoreCollection(ProgramRegistrationModel, data.programRegistrations);
        await restoreCollection(RegistrationScheduleModel, data.registrationSchedules);
        await restoreCollection(PendingResultModel, data.pendingResults);
        await restoreCollection(ApprovedResultModel, data.approvedResults);
        await restoreCollection(LiveScoreModel, data.liveScores);
        await restoreCollection(ReplacementRequestModel, data.replacementRequests);
        await restoreCollection(NotificationModel, data.notifications);
        await restoreCollection(AdminSettingsModel, data.adminSettings);

        revalidatePath("/");
        return { success: true, message: "Database restored successfully" };
    } catch (error: any) {
        console.error("Restore failed:", error);
        return { success: false, message: error.message || "Restore failed" };
    }
}
