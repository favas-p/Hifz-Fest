"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getResultAnalyticsAction } from "@/app/admin/(secure)/point-calculator/actions";

interface AnalyticsData {
    teams: {
        id: string;
        name: string;
        color: string;
        totalPoints: number;
        pendingPoints: number;
        approvedPoints: number;
    }[];
    topStudents: {
        junior: { student: any; points: number }[];
        senior: { student: any; points: number }[];
        general: { student: any; points: number }[];
    };
    totalResults: {
        pending: number;
        approved: number;
    };
}

export function DetailedAnalytics() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getResultAnalyticsAction().then((res) => {
            setData(res);
            setLoading(false);
        });
    }, []);

    if (loading) return <div className="text-white">Loading analytics...</div>;
    if (!data) return <div className="text-red-400">Failed to load data</div>;

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-white/5 border-white/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-white/50">Total Results</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{data.totalResults.approved + data.totalResults.pending}</div>
                        <div className="text-xs text-white/50 mt-1 flex gap-2">
                            <span className="text-emerald-400">{data.totalResults.approved} Approved</span>
                            <span className="text-amber-400">{data.totalResults.pending} Pending</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="teams" className="w-full flex flex-col items-center gap-6">
                <TabsList className="bg-white/5 border border-white/10 p-1 h-auto rounded-full w-fit">
                    <TabsTrigger value="teams" className="rounded-full px-6 py-2.5 data-[state=active]:bg-white/10 data-[state=active]:text-white transition-all">Team Standings</TabsTrigger>
                    <TabsTrigger value="students" className="rounded-full px-6 py-2.5 data-[state=active]:bg-white/10 data-[state=active]:text-white transition-all">Top Students</TabsTrigger>
                </TabsList>

                <TabsContent value="teams" className="mt-4 space-y-4 w-full">
                    {data.teams.map((team, index) => (
                        <Card key={team.id} className="bg-white/5 border-white/10 overflow-hidden">
                            <div className="h-2 w-full" style={{ backgroundColor: team.color }} />
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <span className="text-2xl font-bold text-white/20">#{index + 1}</span>
                                        <div>
                                            <h3 className="text-xl font-bold text-white">{team.name}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge className="border border-emerald-500/20 text-emerald-400 bg-emerald-500/10">
                                                    {team.approvedPoints} Confirmed
                                                </Badge>
                                                {team.pendingPoints > 0 && (
                                                    <Badge className="border border-amber-500/20 text-amber-400 bg-amber-500/10">
                                                        +{team.pendingPoints} Pending
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-3xl font-bold text-white">{team.totalPoints}</div>
                                        <div className="text-xs text-white/50 uppercase tracking-widest">Potential Total</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </TabsContent>

                <TabsContent value="students" className="mt-4 w-full">
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Junior Toppers */}
                        <Card className="bg-white/5 border-white/10">
                            <CardHeader>
                                <CardTitle className="text-white">Junior Category</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {data.topStudents.junior.map((item, i) => (
                                    <div key={item.student.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/20 text-sm font-bold text-indigo-300">
                                                {i + 1}
                                            </div>
                                            <div>
                                                <p className="font-medium text-white">{item.student.name}</p>
                                                <p className="text-xs text-white/50">{item.student.chest_no}</p>
                                            </div>
                                        </div>
                                        <div className="font-bold text-white">{item.points} pts</div>
                                    </div>
                                ))}
                                {data.topStudents.junior.length === 0 && <p className="text-white/50 text-sm">No data yet.</p>}
                            </CardContent>
                        </Card>

                        {/* Senior Toppers */}
                        <Card className="bg-white/5 border-white/10">
                            <CardHeader>
                                <CardTitle className="text-white">Senior Category</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {data.topStudents.senior.map((item, i) => (
                                    <div key={item.student.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-fuchsia-500/20 text-sm font-bold text-fuchsia-300">
                                                {i + 1}
                                            </div>
                                            <div>
                                                <p className="font-medium text-white">{item.student.name}</p>
                                                <p className="text-xs text-white/50">{item.student.chest_no}</p>
                                            </div>
                                        </div>
                                        <div className="font-bold text-white">{item.points} pts</div>
                                    </div>
                                ))}
                                {data.topStudents.senior.length === 0 && <p className="text-white/50 text-sm">No data yet.</p>}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
