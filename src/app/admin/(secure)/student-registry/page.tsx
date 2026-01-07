import { getStudentRegistry, bulkImportToRegistry, getRegisteredStudentCount, getRegisteredStudents, getTeamsShort } from "@/actions/student-registry";
import { StudentRegistryUI } from "@/components/student-registry-ui";
import { GraduationCap, Database, FileUp } from "lucide-react";
import fs from "fs";
import path from "path";

// Function to parse the CSV file if it exists and registry is empty
async function checkAndSeedRegistry() {
    const students = await getStudentRegistry();

    // Only seed if empty
    if (students.length === 0) {
        try {
            const csvPath = path.join(process.cwd(), "Hifz Fesst Data.csv");
            if (fs.existsSync(csvPath)) {
                const csvData = fs.readFileSync(csvPath, "utf-8");
                const lines = csvData.split("\n");

                const toImport = lines.slice(1) // Skip header
                    .filter(line => line.trim())
                    .map(line => {
                        const [uid, name] = line.split(",").map(s => s.trim());
                        return { uid, name };
                    })
                    .filter(s => s.uid && s.name);

                if (toImport.length > 0) {
                    await bulkImportToRegistry(toImport);
                    return await getStudentRegistry();
                }
            }
        } catch (error) {
            console.error("Auto-import failed:", error);
        }
    }
    return students;
}

export default async function StudentRegistryPage() {
    const students = await checkAndSeedRegistry();
    const registeredCount = await getRegisteredStudentCount();
    const registeredStudents = await getRegisteredStudents();
    const teams = await getTeamsShort();

    return (
        <div className="space-y-8 pb-10">
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center">
                        <Database className="h-6 w-6 text-purple-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Student Registry</h1>
                        <p className="text-white/60">Manage the master list of all eligible festival participants.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <GraduationCap className="h-5 w-5 text-purple-400" />
                        <h3 className="font-semibold text-sm">Total Registry</h3>
                    </div>
                    <p className="text-4xl font-bold">{students.length}</p>
                    <p className="text-xs text-white/40 mt-1">Students in master list</p>
                </div>

                <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <Database className="h-5 w-5 text-green-400" />
                        <h3 className="font-semibold text-sm">Actually Registered</h3>
                    </div>
                    <p className="text-4xl font-bold text-green-400">{registeredCount}</p>
                    <p className="text-xs text-white/40 mt-1">Students registered in app</p>
                </div>

                <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-sm md:col-span-2">
                    <div className="flex items-center gap-3 mb-4">
                        <FileUp className="h-5 w-5 text-blue-400" />
                        <h3 className="font-semibold text-sm">Registration Status</h3>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                            <span className="text-white/60">Completion Rate</span>
                            <span className="text-white font-medium">{Math.round((registeredCount / (students.length || 1)) * 100)}%</span>
                        </div>
                        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-linear-to-r from-purple-500 to-green-500"
                                style={{ width: `${Math.min(100, (registeredCount / (students.length || 1)) * 100)}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <StudentRegistryUI
                initialStudents={students}
                initialRegisteredStudents={registeredStudents}
                teams={teams}
            />
        </div>
    );
}
