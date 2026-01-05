
import { connectDB } from "./db";
import { ApprovedResultModel, PendingResultModel, StudentModel, TeamModel } from "./models";


export interface AnalyticsSummary {
    teams: {
        id: string;
        name: string;
        color: string;
        totalPoints: number;
        pendingPoints: number;
        approvedPoints: number;
    }[];
    topStudents: {
        junior: {
            student: any;
            points: number;
        }[];
        senior: {
            student: any;
            points: number;
        }[];
        general: { // Assuming 'general' category exists or fits in 'common'
            student: any;
            points: number;
        }[];
    };
    totalResults: {
        pending: number;
        approved: number;
    };
}

export async function getResultAnalytics(): Promise<AnalyticsSummary> {
    await connectDB();

    // Fetch all data
    const [teams, students, pendingResults, approvedResults] = await Promise.all([
        TeamModel.find().lean(),
        StudentModel.find().lean(),
        PendingResultModel.find().lean(),
        ApprovedResultModel.find().lean(),
    ]);

    // 1. Calculate Team Points (Approved + Pending)
    // Initialize map with current live points (which are from approved results mostly)
    // BUT user wants to see "Calculate pending results also"
    // So we will recalculate everything from scratch based on the result records to be sure,
    // OR we can just add pending points to the existing totals.
    // To be safe and purely analytical, let's tally points from the fetched result records.

    const teamStats = new Map<string, { approved: number; pending: number; name: string; color: string }>();

    teams.forEach(t => {
        teamStats.set(t.id, { approved: 0, pending: 0, name: t.name, color: t.color });
    });

    // Helper to process results
    const processResult = (result: any, type: 'approved' | 'pending') => {
        // Entries
        result.entries.forEach((entry: any) => {
            const score = entry.score; // Already calculated and stored
            if (entry.team_id) {
                const stats = teamStats.get(entry.team_id);
                if (stats) stats[type] += score;
            }
            // If student entry, we also need to attribute to team (already done via team_id in entry usually, but let's double check logic)
            // In result-service, 'buildEntries' adds team_id to student entries too.
        });

        // Penalties
        if (result.penalties) {
            result.penalties.forEach((penalty: any) => {
                const points = penalty.points;
                if (penalty.team_id) {
                    const stats = teamStats.get(penalty.team_id);
                    // Penalties subtracted
                    if (stats) stats[type] -= points;
                }
            });
        }
    };

    approvedResults.forEach(r => processResult(r, 'approved'));
    pendingResults.forEach(r => processResult(r, 'pending'));

    const teamSummary = Array.from(teamStats.entries()).map(([id, stats]) => ({
        id,
        name: stats.name,
        color: stats.color,
        approvedPoints: stats.approved,
        pendingPoints: stats.pending,
        totalPoints: stats.approved + stats.pending
    })).sort((a, b) => b.totalPoints - a.totalPoints);

    // 2. Top Students
    const studentStats = new Map<string, { points: number; student: any }>();
    students.forEach(s => {
        studentStats.set(s.id, { points: 0, student: s });
    });

    const processStudentPoints = (result: any) => {
        result.entries.forEach((entry: any) => {
            if (entry.student_id) {
                const stats = studentStats.get(entry.student_id);
                if (stats) stats.points += entry.score;
            }
        });
        // Penalties usually apply to team, but if student specific penalty exists?
        // The interface has student_id in PenaltyEntry, so yes.
        if (result.penalties) {
            result.penalties.forEach((penalty: any) => {
                if (penalty.student_id) {
                    const stats = studentStats.get(penalty.student_id);
                    if (stats) stats.points -= penalty.points;
                }
            });
        }
    };

    approvedResults.forEach(r => processStudentPoints(r));
    pendingResults.forEach(r => processStudentPoints(r));

    const allStudents = Array.from(studentStats.values());

    const getTop = (category: string) => allStudents
        .filter(s => s.student.category === category)
        .sort((a, b) => b.points - a.points)
        .slice(0, 5); // Top 5

    return JSON.parse(JSON.stringify({
        teams: teamSummary,
        topStudents: {
            junior: getTop('junior'),
            senior: getTop('senior'),
            general: getTop('general')
        },
        totalResults: {
            pending: pendingResults.length,
            approved: approvedResults.length
        }
    }));
}
