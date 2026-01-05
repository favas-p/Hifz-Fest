"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchSelect } from "@/components/ui/search-select";
import { ChestNumberPreview } from "@/components/chest-number-preview";
import { createStudentAction } from "@/actions/student";
import type { AllowedParticipant } from "@/lib/allowed-participants";
import type { PortalStudent } from "@/lib/types";

interface AddStudentFormProps {
    allowedParticipants: AllowedParticipant[];
    teamName: string;
    teamStudents: PortalStudent[];
    isOpen: boolean;
}

export function AddStudentForm({
    allowedParticipants,
    teamName,
    teamStudents,
    isOpen,
}: AddStudentFormProps) {
    const [uid, setUid] = useState("");
    const [name, setName] = useState("");

    // Prepare options for SearchSelect
    const participantOptions = allowedParticipants.map((p) => ({
        label: p.uid,
        value: p.uid,
    }));

    // Handle UID selection
    const handleUidChange = (value: string) => {
        setUid(value);
        const participant = allowedParticipants.find(
            (p) => p.uid.toLowerCase() === value.trim().toLowerCase()
        );
        if (participant) {
            setName(participant.name);
        } else {
            setName("");
        }
    };

    return (
        <>
            <ChestNumberPreview teamName={teamName} teamStudents={teamStudents} />
            <form
                action={createStudentAction}
                className="mt-4 grid gap-3 sm:gap-4 sm:grid-cols-[250px_1fr_auto_auto]"
            >
                {/* UID Selection */}
                <div className="w-full">
                    <SearchSelect
                        name="badge_uid"
                        options={participantOptions}
                        value={uid}
                        onValueChange={handleUidChange}
                        placeholder="Select Participant (UID)"
                        required={true}
                        className="w-full"
                    />
                </div>

                {/* Name - Read Only */}
                <Input
                    name="name"
                    placeholder="Student Name"
                    value={name}
                    readOnly
                    tabIndex={-1}
                    className="bg-white/5 border-white/10 text-white/70 placeholder:text-white/30 cursor-not-allowed w-full focus-visible:ring-0"
                />

                <select
                    name="category"
                    defaultValue=""
                    required
                    className="w-[180px] bg-white/10 border-white/20 text-white rounded-2xl px-4 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <option value="" disabled className="bg-slate-900">
                        Select Category
                    </option>
                    <option value="junior" className="bg-slate-900">
                        Junior
                    </option>
                    <option value="senior" className="bg-slate-900">
                        Senior
                    </option>
                </select>

                <Button type="submit" className="w-full sm:w-auto">
                    Add Student
                </Button>
            </form>
        </>
    );
}
