"use client";

import { useState, useTransition } from "react";
import { Plus, Search, Edit2, Trash2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
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
    addInstituteToRegistry,
    updateInstituteInRegistry,
    deleteInstituteFromRegistry
} from "@/actions/institute-registry";
import { InstituteRegistry } from "@/lib/types";

interface InstituteRegistryUIProps {
    initialInstitutes: InstituteRegistry[];
}

export function InstituteRegistryUI({ initialInstitutes }: InstituteRegistryUIProps) {
    const [institutes, setInstitutes] = useState<InstituteRegistry[]>(initialInstitutes);
    const [searchQuery, setSearchQuery] = useState("");
    const [isPending, startTransition] = useTransition();
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingInstitute, setEditingInstitute] = useState<InstituteRegistry | null>(null);

    const filtered = institutes.filter(inst =>
        inst.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inst.shortName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const name = formData.get("name") as string;
        const shortName = formData.get("shortName") as string;

        startTransition(async () => {
            try {
                await addInstituteToRegistry({ name, shortName });
                toast.success("Institute added");
                setIsAddOpen(false);
                window.location.reload();
            } catch (error) {
                toast.error("Failed to add institute");
            }
        });
    };

    const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editingInstitute) return;

        const formData = new FormData(e.currentTarget);
        const name = formData.get("name") as string;
        const shortName = formData.get("shortName") as string;

        startTransition(async () => {
            try {
                await updateInstituteInRegistry(editingInstitute.id, { name, shortName });
                toast.success("Institute updated");
                setIsEditOpen(false);
                window.location.reload();
            } catch (error) {
                toast.error("Failed to update");
            }
        });
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this institute from registry?")) return;
        startTransition(async () => {
            try {
                await deleteInstituteFromRegistry(id);
                toast.success("Deleted");
                window.location.reload();
            } catch (error) {
                toast.error("Failed to delete");
            }
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between">
                <div className="relative w-full md:w-96 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 group-focus-within:text-purple-400 transition-colors" />
                    <Input
                        placeholder="Search by name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-white/5 border-white/10 rounded-2xl"
                    />
                </div>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-purple-600 hover:bg-purple-700 rounded-2xl gap-2 font-medium">
                            <Plus className="h-4 w-4" />
                            Add Institute
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-900 border-white/10 text-white rounded-3xl">
                        <DialogHeader><DialogTitle>Add New Institute</DialogTitle></DialogHeader>
                        <form onSubmit={handleAdd} className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <label className="text-xs uppercase text-white/40 font-bold ml-1">Full Institute Name</label>
                                <Input name="name" required className="bg-white/5 border-white/10 rounded-2xl text-white" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs uppercase text-white/40 font-bold ml-1">Short Name/Value (Optional)</label>
                                <Input name="shortName" className="bg-white/5 border-white/10 rounded-2xl text-white" />
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={isPending} className="bg-purple-600 rounded-xl">
                                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Institute"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="bg-white/5 border-white/10 rounded-3xl overflow-hidden backdrop-blur-sm">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-white/10 bg-white/5">
                            <th className="p-4 text-xs uppercase text-white/40 font-bold tracking-wider">Name</th>
                            <th className="p-4 text-xs uppercase text-white/40 font-bold tracking-wider">Short Name</th>
                            <th className="p-4 text-xs uppercase text-white/40 font-bold tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filtered.length > 0 ? (
                            filtered.map((inst) => (
                                <tr key={inst.id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4 text-white font-medium">{inst.name}</td>
                                    <td className="p-4 text-white/40 font-mono">{inst.shortName || "-"}</td>
                                    <td className="p-4 text-right space-x-2">
                                        <Button variant="ghost" size="icon" onClick={() => { setEditingInstitute(inst); setIsEditOpen(true); }} className="rounded-xl hover:bg-white/10"><Edit2 className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(inst.id)} className="rounded-xl hover:bg-red-500/20 hover:text-red-400"><Trash2 className="h-4 w-4" /></Button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan={3} className="p-12 text-center text-white/40 italic">No institutes found</td></tr>
                        )}
                    </tbody>
                </table>
            </Card>

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="bg-slate-900 border-white/10 text-white rounded-3xl">
                    <DialogHeader><DialogTitle>Edit Institute</DialogTitle></DialogHeader>
                    {editingInstitute && (
                        <form onSubmit={handleEdit} className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <label className="text-xs uppercase text-white/40 font-bold ml-1">Name</label>
                                <Input name="name" defaultValue={editingInstitute.name} required className="bg-white/5 border-white/10 rounded-2xl" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs uppercase text-white/40 font-bold ml-1">Short Name</label>
                                <Input name="shortName" defaultValue={editingInstitute.shortName} className="bg-white/5 border-white/10 rounded-2xl" />
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={isPending} className="bg-purple-600 rounded-xl">
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
