"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SearchSelect } from "@/components/ui/search-select";
import { calculateScore, GradeType, GRADE_BONUS, GROUP_SCORES, INDIVIDUAL_SCORES } from "@/lib/scoring";

const PROGRAM_TYPES = [
    { value: "single", label: "Individual Item" },
    { value: "group", label: "Group Item" },
];

const POSITIONS = [
    { value: "1", label: "1st Place" },
    { value: "2", label: "2nd Place" },
    { value: "3", label: "3rd Place" },
];

const GRADES = [
    { value: "A", label: "Grade A" },
    { value: "B", label: "Grade B" },
    { value: "C", label: "Grade C" },
    { value: "none", label: "No Grade" },
];

export function PointCalculator() {
    const [type, setType] = useState<"single" | "group">("single");
    const [position, setPosition] = useState<"1" | "2" | "3">("1");
    const [grade, setGrade] = useState<GradeType | "none">("A");

    const numericPosition = parseInt(position) as 1 | 2 | 3;

    // Calculate Score
    const totalScore = useMemo(() => {
        return calculateScore(type, numericPosition, grade as GradeType);
    }, [type, numericPosition, grade]);

    // Breakdown
    const basePoints = type === "single" ? (INDIVIDUAL_SCORES[numericPosition] || 0) : (GROUP_SCORES[numericPosition] || 0);
    const gradeBonus = (grade && grade !== "none") ? GRADE_BONUS[grade as Exclude<GradeType, "none">] : 0;

    return (
        <div className="grid gap-6 md:grid-cols-2">
            <Card className="h-fit bg-white/5 border-white/10 text-white">
                <CardHeader>
                    <CardTitle className="text-white">Calculation Parameters</CardTitle>
                    <CardDescription className="text-white/50">
                        Select the criteria to determine the point value.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white/80">Program Type</label>
                        <div className="grid grid-cols-2 gap-2">
                            {PROGRAM_TYPES.map((t) => (
                                <div
                                    key={t.value}
                                    onClick={() => setType(t.value as any)}
                                    className={`cursor-pointer rounded-lg border px-4 py-3 text-center text-sm transition-all ${type === t.value
                                        ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-400 font-semibold"
                                        : "border-white/10 hover:bg-white/5 text-white/70"
                                        }`}
                                >
                                    {t.label}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white/80">Position</label>
                        <SearchSelect
                            name="position_select"
                            options={POSITIONS}
                            value={position}
                            onValueChange={(val) => setPosition(val as any)}
                            placeholder="Select Position"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white/80">Grade</label>
                        <SearchSelect
                            name="grade_select"
                            options={GRADES}
                            value={grade}
                            onValueChange={(val) => setGrade(val as any)}
                            placeholder="Select Grade"
                        />
                    </div>
                </CardContent>
            </Card>

            <Card className="h-fit bg-white/5 border-white/10 text-white">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-white">Calculated Score</CardTitle>
                        <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/50">
                            Live Preview
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-8">
                        <div className="text-8xl font-bold bg-linear-to-br from-white to-white/60 bg-clip-text text-transparent">
                            {totalScore}
                        </div>
                        <div className="text-sm text-white/50 uppercase tracking-widest font-medium mt-2">
                            Total Points
                        </div>
                    </div>

                    <div className="mt-8 space-y-3 rounded-xl bg-white/5 p-4 border border-white/10">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-white/70">Base Points ({type === "single" ? "Individual" : "Group"} {position === "1" ? "1st" : (position === "2" ? "2nd" : "3rd")})</span>
                            <span className="font-mono font-medium text-white">{basePoints}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-white/70">Grade Bonus ({grade !== "none" ? `Grade ${grade}` : "None"})</span>
                            <span className="font-mono font-medium text-emerald-400">+{gradeBonus}</span>
                        </div>
                        <div className="my-2 border-t border-white/10" />
                        <div className="flex items-center justify-between font-semibold">
                            <span>Final Score</span>
                            <span>{totalScore}</span>
                        </div>
                    </div>

                    <div className="mt-6 text-xs text-white/40 text-center">
                        Calculated based on standard fest manual rules.
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
