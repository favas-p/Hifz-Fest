"use client";

import { useState, useTransition } from "react";
import { Plus, Search, Edit2, Trash2, Download, Upload, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "react-toastify";
import {
    addStudentToRegistry,
    updateStudentInRegistry,
    deleteStudentFromRegistry,
    bulkImportToRegistry
} from "@/actions/student-registry";
import { StudentRegistry, Student } from "@/lib/types";
import { cn } from "@/lib/utils";

interface StudentRegistryUIProps {
    initialStudents: StudentRegistry[];
    initialRegisteredStudents: Student[];
    teams: { id: string; name: string }[];
}

export function StudentRegistryUI({ initialStudents, initialRegisteredStudents, teams }: StudentRegistryUIProps) {
    const [students, setStudents] = useState<StudentRegistry[]>(initialStudents);
    const [registeredStudents, setRegisteredStudents] = useState<Student[]>(initialRegisteredStudents);
    const [activeTab, setActiveTab] = useState<"registry" | "registered">("registry");
    const [searchQuery, setSearchQuery] = useState("");
    const [isPending, startTransition] = useTransition();
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<StudentRegistry | null>(null);

    // Filtered students (Registry)
    const filteredRegistry = students.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.uid.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Filtered students (Registered)
    const filteredRegistered = registeredStudents.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.badge_uid && s.badge_uid.toLowerCase().includes(searchQuery.toLowerCase())) ||
        s.chest_no.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const uid = formData.get("uid") as string;
        const name = formData.get("name") as string;

        startTransition(async () => {
            try {
                await addStudentToRegistry({ uid, name });
                toast.success("Student added to registry");
                setIsAddOpen(false);
                // Refresh local state (simplistic approach for now)
                window.location.reload();
            } catch (error) {
                toast.error("Failed to add student");
            }
        });
    };

    const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editingStudent) return;

        const formData = new FormData(e.currentTarget);
        const uid = formData.get("uid") as string;
        const name = formData.get("name") as string;

        startTransition(async () => {
            try {
                await updateStudentInRegistry(editingStudent.id, { uid, name });
                toast.success("Student updated");
                setIsEditOpen(false);
                window.location.reload();
            } catch (error) {
                toast.error("Failed to update student");
            }
        });
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this student from the registry?")) return;

        startTransition(async () => {
            try {
                await deleteStudentFromRegistry(id);
                toast.success("Student deleted");
                window.location.reload();
            } catch (error) {
                toast.error("Failed to delete student");
            }
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
                    <button
                        onClick={() => setActiveTab("registry")}
                        className={cn(
                            "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                            activeTab === "registry"
                                ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20"
                                : "text-white/60 hover:text-white hover:bg-white/5"
                        )}
                    >
                        Master Registry
                    </button>
                    <button
                        onClick={() => setActiveTab("registered")}
                        className={cn(
                            "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                            activeTab === "registered"
                                ? "bg-green-600 text-white shadow-lg shadow-green-500/20"
                                : "text-white/60 hover:text-white hover:bg-white/5"
                        )}
                    >
                        Registered Students
                    </button>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-2xl gap-2 font-medium">
                                <Plus className="h-4 w-4" />
                                Add Student
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-slate-900 border-white/10 text-white rounded-3xl">
                            <DialogHeader>
                                <DialogTitle>Add New Student to Registry</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleAdd} className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <label className="text-xs uppercase text-white/40 font-bold ml-1">UID (e.g., HQ0001)</label>
                                    <Input name="uid" required placeholder="HQ0001" className="bg-white/5 border-white/10 rounded-xl" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs uppercase text-white/40 font-bold ml-1">Full Name</label>
                                    <Input name="name" required placeholder="MUHAMMAD ADIL" className="bg-white/5 border-white/10 rounded-xl" />
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)} className="rounded-xl">Cancel</Button>
                                    <Button type="submit" disabled={isPending} className="bg-purple-600 hover:bg-purple-700 rounded-xl">
                                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Student"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="relative w-full group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 group-focus-within:text-purple-400 transition-colors" />
                <Input
                    placeholder={activeTab === "registry" ? "Search by UID or Name..." : "Search by UID, Name or Chest No..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white/5 border-white/10 rounded-2xl focus:border-purple-500 transition-all text-white placeholder:text-white/20"
                />
            </div>

            <Card className="bg-white/5 border-white/10 rounded-3xl overflow-hidden backdrop-blur-sm">
                <div className="overflow-x-auto">
                    {activeTab === "registry" ? (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/10 bg-white/5">
                                    <th className="p-4 text-xs uppercase text-white/40 font-bold tracking-wider">UID</th>
                                    <th className="p-4 text-xs uppercase text-white/40 font-bold tracking-wider">Name</th>
                                    <th className="p-4 text-xs uppercase text-white/40 font-bold tracking-wider">Created At</th>
                                    <th className="p-4 text-xs uppercase text-white/40 font-bold tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredRegistry.length > 0 ? (
                                    filteredRegistry.map((student) => (
                                        <tr key={student.id} className="hover:bg-white/2 transition-colors group">
                                            <td className="p-4 font-mono text-purple-400 font-medium">{student.uid}</td>
                                            <td className="p-4 text-white font-medium">{student.name}</td>
                                            <td className="p-4 text-white/40 text-sm">{new Date(student.createdAt).toLocaleDateString()}</td>
                                            <td className="p-4 text-right space-x-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        setEditingStudent(student);
                                                        setIsEditOpen(true);
                                                    }}
                                                    className="h-8 w-8 rounded-xl hover:bg-white/10 text-white/60 hover:text-white"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(student.id)}
                                                    className="h-8 w-8 rounded-xl hover:bg-red-500/20 text-white/60 hover:text-red-400"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="p-12 text-center text-white/40">
                                            <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                            <p>No students found in registry</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/10 bg-white/5">
                                    <th className="p-4 text-xs uppercase text-white/40 font-bold tracking-wider">Order</th>
                                    <th className="p-4 text-xs uppercase text-white/40 font-bold tracking-wider">UID</th>
                                    <th className="p-4 text-xs uppercase text-white/40 font-bold tracking-wider">Name</th>
                                    <th className="p-4 text-xs uppercase text-white/40 font-bold tracking-wider">Chest No</th>
                                    <th className="p-4 text-xs uppercase text-white/40 font-bold tracking-wider">Team</th>
                                    <th className="p-4 text-xs uppercase text-white/40 font-bold tracking-wider">Category</th>
                                    <th className="p-4 text-xs uppercase text-white/40 font-bold tracking-wider">Reg Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredRegistered.length > 0 ? (
                                    filteredRegistered.map((student, index) => (
                                        <tr key={student.id} className="hover:bg-white/2 transition-colors group">
                                            <td className="p-4 text-white/20 font-mono text-xs">{index + 1}</td>
                                            <td className="p-4 font-mono text-green-400 font-medium">{student.badge_uid || "N/A"}</td>
                                            <td className="p-4 text-white font-medium">{student.name}</td>
                                            <td className="p-4 text-white/60 font-mono">{student.chest_no}</td>
                                            <td className="p-4">
                                                <div className="flex flex-col">
                                                    <span className="text-white font-medium text-sm">
                                                        {teams.find(t => t.id === student.team_id)?.name || student.team_id}
                                                    </span>
                                                    <span className="text-[10px] text-white/20 font-mono uppercase">{student.team_id}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={cn(
                                                    "px-2 py-1 rounded-lg text-[10px] font-bold uppercase",
                                                    student.category === "senior" ? "bg-orange-500/10 text-orange-400 border border-orange-500/20" : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                                )}>
                                                    {student.category || "JUNIOR"}
                                                </span>
                                            </td>
                                            <td className="p-4 text-white/40 text-sm">
                                                {/* @ts-ignore - createdAt exists from Mongoose timestamps */}
                                                {student.createdAt ? new Date(student.createdAt).toLocaleDateString() : "N/A"}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="p-12 text-center text-white/40">
                                            <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                            <p>No registered students found</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </Card>

            {/* Edit Modal */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="bg-slate-900 border-white/10 text-white rounded-3xl">
                    <DialogHeader>
                        <DialogTitle>Edit Registry Entry</DialogTitle>
                    </DialogHeader>
                    {editingStudent && (
                        <form onSubmit={handleEdit} className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <label className="text-xs uppercase text-white/40 font-bold ml-1">UID</label>
                                <Input name="uid" defaultValue={editingStudent.uid} required className="bg-white/5 border-white/10 rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs uppercase text-white/40 font-bold ml-1">Full Name</label>
                                <Input name="name" defaultValue={editingStudent.name} required className="bg-white/5 border-white/10 rounded-xl" />
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)} className="rounded-xl">Cancel</Button>
                                <Button type="submit" disabled={isPending} className="bg-purple-600 hover:bg-purple-700 rounded-xl">
                                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
