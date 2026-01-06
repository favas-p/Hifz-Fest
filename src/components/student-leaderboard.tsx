"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Medal, Search, Crown, ChevronRight } from "lucide-react";
import type { Student, Team, ResultRecord, Program } from "@/lib/types";
import Image from "next/image";

interface StudentLeaderboardProps {
    students: Student[];
    teams: Team[];
    results: ResultRecord[];
    programMap: Map<string, Program>;
}

export function StudentLeaderboard({ students, teams, results, programMap }: StudentLeaderboardProps) {
    const [search, setSearch] = useState("");
    const [activeCategory, setActiveCategory] = useState<"junior" | "senior" | "general" | "hifz">("junior");
    const [activeView, setActiveView] = useState<"individual" | "team">("individual"); // New state for view toggle

    const teamMap = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);

    // Handle initial category when switching views
    useMemo(() => {
        if (activeView === "individual" && (activeCategory === "general" || activeCategory === "hifz")) {
            setActiveCategory("junior");
        }
    }, [activeView, activeCategory]);


    const categoryStudents = useMemo(() => {
        if (activeCategory === "general" || activeCategory === "hifz") return []; // No General/Hifz for individuals in this context (or handled differently)
        return students.filter(s => (s.category || "junior") === activeCategory);
    }, [students, activeCategory]);

    const sortedStudents = useMemo(() => {
        const sorted = [...categoryStudents]
            .filter((s) => s.total_points > 0)
            .sort((a, b) => b.total_points - a.total_points);

        let currentRank = 1;
        return sorted.map((student, index) => {
            if (index > 0 && student.total_points < sorted[index - 1].total_points) {
                currentRank++;
            }
            return {
                ...student,
                rank: currentRank,
                teamName: teamMap.get(student.team_id)?.name || "Unknown Team",
                teamColor: teamMap.get(student.team_id)?.color || "#808080",
            };
        });
    }, [categoryStudents, teamMap]);

    const filteredStudents = useMemo(() => {
        if (!search.trim()) return sortedStudents;
        const normalized = search.toLowerCase();
        return sortedStudents.filter(
            (s) =>
                s.name.toLowerCase().includes(normalized) ||
                s.chest_no.toLowerCase().includes(normalized) ||
                s.teamName.toLowerCase().includes(normalized)
        );
    }, [search, sortedStudents]);

    // Team Leaderboard Logic
    const sortedTeams = useMemo(() => {
        // Calculate points based on activeCategory
        const teamPoints = new Map<string, number>();

        // Initialize teams with 0 points
        teams.forEach(t => teamPoints.set(t.id, 0));

        results.forEach(result => {
            const program = programMap.get(result.program_id);
            if (!program) return;

            // Filter by category
            let include = false;
            if (activeCategory === "general") {
                include = true;
            } else if (activeCategory === "hifz") {
                include = program.section === "hifz" || program.name.toLowerCase().includes("hifz");
            } else {
                include = program.section === activeCategory;
            }

            if (include) {
                result.entries.forEach(entry => {
                    // Add points to team from student entries
                    if (entry.student_id && entry.score) {
                        // Find student to get team_id
                        // Optimization: Create student Map if needed, but here we might need to rely on existing students list or entry data?
                        // The entry structure usually links to student, we need student's team.
                        // But wait, entry might have team_id directly for group items?
                        // Let's look at ResultEntry type: student_id, team_id, score.

                        let teamId = entry.team_id;
                        if (!teamId && entry.student_id) {
                            // If no team_id in entry, find it via student list
                            const student = students.find(s => s.id === entry.student_id);
                            if (student) teamId = student.team_id;
                        }

                        if (teamId) {
                            const current = teamPoints.get(teamId) || 0;
                            teamPoints.set(teamId, current + entry.score);
                        }
                    }
                    // For team events directly with team_id
                    if (entry.team_id && entry.score && !entry.student_id) {
                        const current = teamPoints.get(entry.team_id) || 0;
                        teamPoints.set(entry.team_id, current + entry.score);
                    }
                });
            }
        });

        const sorted = [...teams].map(t => ({
            ...t,
            total_points: teamPoints.get(t.id) || 0
        }))
            .filter(t => t.total_points > 0)
            .sort((a, b) => b.total_points - a.total_points);

        let currentRank = 1;
        return sorted.map((team, index) => {
            if (index > 0 && team.total_points < sorted[index - 1].total_points) {
                currentRank++;
            }
            return {
                ...team,
                rank: currentRank,
            };
        });
    }, [teams, results, programMap, activeCategory, students]);

    const filteredTeams = useMemo(() => {
        if (!search.trim()) return sortedTeams;
        const normalized = search.toLowerCase();
        return sortedTeams.filter((t) => t.name.toLowerCase().includes(normalized));
    }, [search, sortedTeams]);

    const topStudents = sortedStudents.slice(0, 3);
    const restStudents = filteredStudents.filter((s, index) => index >= 3 || search); // Fix filtering for display

    const topTeams = sortedTeams.slice(0, 3);
    const restTeams = filteredTeams.filter((t, index) => index >= 3 || search);


    // Helper to determine podium label
    const getPodiumLabel = (rank: number) => {
        const categoryLabel = activeCategory === "general" ? "" : ` (${activeCategory.toUpperCase()})`;
        // For teams, we don't need category label in this context as teams are overarching, or maybe we do?
        // Assuming team scores are total, not category specific for now based on types provided.
        // If activeView is team, we might want to just say CHAMPION etc or CHAMPION TEAM
        if (activeView === "team") {
            if (rank === 1) return `CHAMPION${categoryLabel}`;
            if (rank === 2) return "2ND PLACE";
            if (rank === 3) return "3RD PLACE";
            return `${rank}TH PLACE`;
        }

        if (rank === 1) return `CHAMPION${categoryLabel}`;
        if (rank === 2) return "2ND PLACE";
        if (rank === 3) return "3RD PLACE";
        return `${rank}TH PLACE`;
    };

    const getPodiumStyles = (rank: number) => {
        switch (rank) {
            case 1:
                return {
                    border: "border-yellow-400",
                    ring: "ring-4 ring-yellow-400/20",
                    badge: "bg-yellow-500",
                    text: "text-yellow-700",
                    bg: "bg-yellow-50",
                    borderSmall: "border-yellow-200",
                    iconColor: "text-yellow-500",
                    crown: true
                };
            case 2:
                return {
                    border: "border-gray-300",
                    ring: "ring-4 ring-gray-100",
                    badge: "bg-gray-600",
                    text: "text-gray-700",
                    bg: "bg-gray-50",
                    borderSmall: "border-gray-200",
                    iconColor: "text-gray-400",
                    crown: false
                };
            case 3:
                return {
                    border: "border-orange-300",
                    ring: "ring-4 ring-orange-100",
                    badge: "bg-orange-400",
                    text: "text-orange-700",
                    bg: "bg-orange-50",
                    borderSmall: "border-orange-200",
                    iconColor: "text-orange-400",
                    crown: false
                };
            default:
                return {
                    border: "border-blue-300",
                    ring: "",
                    badge: "bg-blue-400",
                    text: "text-gray-700",
                    bg: "bg-white",
                    borderSmall: "border-gray-200",
                    iconColor: "text-blue-400",
                    crown: false
                };
        }
    };

    const renderPodium = (items: any[], isTeam: boolean) => (
        <div className="relative mt-8 mb-12 px-4">
            <div className="flex items-start justify-center gap-2 md:gap-8 pt-14 pb-8">
                {/* 2nd Slot (Left) */}
                {items[1] && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex flex-col items-center w-1/3 max-w-[140px] mt-8 md:mt-12"
                    >
                        <div className="relative mb-6 md:mb-8">
                            {getPodiumStyles(items[1].rank).crown && (
                                <div className="absolute -top-10 md:-top-12 left-1/2 -translate-x-1/2 animate-bounce">
                                    <Crown className="w-8 h-8 md:w-10 md:h-10 text-yellow-500 fill-yellow-500 drop-shadow-lg" />
                                </div>
                            )}
                            <div className={`w-20 h-20 md:w-28 md:h-28 rounded-full border-4 shadow-xl overflow-hidden relative z-10 bg-white ${getPodiumStyles(items[1].rank).border} ${getPodiumStyles(items[1].rank).ring}`}>
                                {isTeam && items[1].leader_photo ? (
                                    <Image
                                        src={items[1].leader_photo}
                                        alt={items[1].name}
                                        fill
                                        className="object-cover"
                                    />
                                ) : !isTeam && items[1].avatar ? (
                                    <Image
                                        src={items[1].avatar}
                                        alt={items[1].name}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-2xl font-bold text-gray-400" style={isTeam ? { backgroundColor: items[1].color + '20', color: items[1].color } : {}}>
                                        {items[1].name[0]}
                                    </div>
                                )}
                            </div>
                            <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 text-white text-[10px] md:text-xs font-bold px-2 md:px-3 py-1 rounded-full shadow-lg z-20 whitespace-nowrap flex items-center gap-1 ${getPodiumStyles(items[1].rank).badge}`}>
                                {getPodiumStyles(items[1].rank).crown && <Trophy className="w-3 h-3" />}
                                {getPodiumLabel(items[1].rank)}
                            </div>
                        </div>
                        <div className="text-center w-full">
                            <h3 className="font-bold text-gray-800 text-sm md:text-lg px-1 text-center leading-tight mb-1">{items[1].name}</h3>
                            {!isTeam && <p className="text-xs text-gray-500 mb-1 text-center leading-tight">{items[1].teamName}</p>}
                            <div className={`inline-block border shadow-sm rounded-lg px-2 md:px-3 py-1 ${getPodiumStyles(items[1].rank).bg} ${getPodiumStyles(items[1].rank).borderSmall}`}>
                                <span className={`font-bold text-sm md:text-base ${getPodiumStyles(items[1].rank).text}`}>{items[1].total_points}</span>
                                <span className="text-[10px] text-gray-400 ml-1">PTS</span>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* 1st Slot (Center) */}
                {items[0] && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="flex flex-col items-center w-1/3 max-w-[160px] z-20"
                    >
                        <div className="relative mb-6 md:mb-8">
                            {getPodiumStyles(items[0].rank).crown && (
                                <div className="absolute -top-10 md:-top-12 left-1/2 -translate-x-1/2 animate-bounce">
                                    <Crown className="w-8 h-8 md:w-10 md:h-10 text-yellow-500 fill-yellow-500 drop-shadow-lg" />
                                </div>
                            )}
                            <div className={`w-24 h-24 md:w-36 md:h-36 rounded-full border-4 shadow-2xl overflow-hidden relative z-10 bg-white ${getPodiumStyles(items[0].rank).border} ${getPodiumStyles(items[0].rank).ring}`}>
                                {isTeam && items[0].leader_photo ? (
                                    <Image
                                        src={items[0].leader_photo}
                                        alt={items[0].name}
                                        fill
                                        className="object-cover"
                                    />
                                ) : !isTeam && items[0].avatar ? (
                                    <Image
                                        src={items[0].avatar}
                                        alt={items[0].name}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-3xl font-bold text-gray-400" style={isTeam ? { backgroundColor: items[0].color + '20', color: items[0].color } : {}}>
                                        {items[0].name[0]}
                                    </div>
                                )}
                            </div>
                            <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 text-white text-[10px] md:text-xs font-bold px-3 md:px-4 py-1 rounded-full shadow-lg z-20 whitespace-nowrap flex items-center gap-1 ${getPodiumStyles(items[0].rank).badge}`}>
                                {getPodiumStyles(items[0].rank).crown && <Trophy className="w-3 h-3" />}
                                {getPodiumLabel(items[0].rank)}
                            </div>
                        </div>
                        <div className="text-center w-full">
                            <h3 className="font-bold text-gray-900 text-sm md:text-xl px-1 text-center leading-tight mb-1">{items[0].name}</h3>
                            {!isTeam && <p className="text-xs text-gray-500 mb-1 text-center leading-tight">{items[0].teamName}</p>}
                            <div className={`inline-block border shadow-sm rounded-lg px-3 md:px-4 py-1 ${getPodiumStyles(items[0].rank).bg} ${getPodiumStyles(items[0].rank).borderSmall}`}>
                                <span className={`font-black text-base md:text-lg ${getPodiumStyles(items[0].rank).text}`}>{items[0].total_points}</span>
                                <span className="text-[10px] text-gray-500/70 ml-1">PTS</span>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* 3rd Slot (Right) */}
                {items[2] && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex flex-col items-center w-1/3 max-w-[140px] mt-8 md:mt-12"
                    >
                        <div className="relative mb-6 md:mb-8">
                            {getPodiumStyles(items[2].rank).crown && (
                                <div className="absolute -top-10 md:-top-12 left-1/2 -translate-x-1/2 animate-bounce">
                                    <Crown className="w-8 h-8 md:w-10 md:h-10 text-yellow-500 fill-yellow-500 drop-shadow-lg" />
                                </div>
                            )}
                            <div className={`w-20 h-20 md:w-28 md:h-28 rounded-full border-4 shadow-xl overflow-hidden relative z-10 bg-white ${getPodiumStyles(items[2].rank).border} ${getPodiumStyles(items[2].rank).ring}`}>
                                {isTeam && items[2].leader_photo ? (
                                    <Image
                                        src={items[2].leader_photo}
                                        alt={items[2].name}
                                        fill
                                        className="object-cover"
                                    />
                                ) : !isTeam && items[2].avatar ? (
                                    <Image
                                        src={items[2].avatar}
                                        alt={items[2].name}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-2xl font-bold text-gray-400" style={isTeam ? { backgroundColor: items[2].color + '20', color: items[2].color } : {}}>
                                        {items[2].name[0]}
                                    </div>
                                )}
                            </div>
                            <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 text-white text-[10px] md:text-xs font-bold px-2 md:px-3 py-1 rounded-full shadow-lg z-20 whitespace-nowrap flex items-center gap-1 ${getPodiumStyles(items[2].rank).badge}`}>
                                {getPodiumStyles(items[2].rank).crown && <Trophy className="w-3 h-3" />}
                                {getPodiumLabel(items[2].rank)}
                            </div>
                        </div>
                        <div className="text-center w-full">
                            <h3 className="font-bold text-gray-800 text-sm md:text-lg px-1 text-center leading-tight mb-1">{items[2].name}</h3>
                            {!isTeam && <p className="text-xs text-gray-500 mb-1 text-center leading-tight">{items[2].teamName}</p>}
                            <div className={`inline-block border shadow-sm rounded-lg px-2 md:px-3 py-1 ${getPodiumStyles(items[2].rank).bg} ${getPodiumStyles(items[2].rank).borderSmall}`}>
                                <span className={`font-bold text-sm md:text-base ${getPodiumStyles(items[2].rank).text}`}>{items[2].total_points}</span>
                                <span className="text-[10px] text-gray-400 ml-1">PTS</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );

    return (
        <div className="space-y-8 md:space-y-12 pt-4 md:pt-8 w-full">
            {/* View Toggle */}
            <div className="flex justify-center px-4 mb-4">
                <div className="bg-white/50 backdrop-blur-md p-1 rounded-2xl border border-gray-200/50 flex gap-1 shadow-sm">
                    <button
                        onClick={() => {
                            setActiveView("individual");
                            setActiveCategory("junior");
                        }}
                        className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeView === "individual"
                            ? "bg-[#8B4513] text-white shadow-md"
                            : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
                            }`}
                    >
                        INDIVIDUAL
                    </button>
                    <button
                        onClick={() => {
                            setActiveView("team");
                            setActiveCategory("general"); // Default to general when switching to team
                        }}
                        className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeView === "team"
                            ? "bg-[#8B4513] text-white shadow-md"
                            : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
                            }`}
                    >
                        TEAM
                    </button>
                </div>
            </div>

            {/* Category Tabs - Render differently based on view */}
            {activeView === "individual" && (
                <div className="flex justify-center px-4">
                    <div className="bg-white/50 backdrop-blur-md p-1 rounded-2xl border border-gray-200/50 flex gap-1">
                        <button
                            onClick={() => setActiveCategory("junior")}
                            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeCategory === "junior"
                                ? "bg-white text-[#8B4513] shadow-sm ring-1 ring-gray-200"
                                : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
                                }`}
                        >
                            JUNIOR
                        </button>
                        <button
                            onClick={() => setActiveCategory("senior")}
                            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeCategory === "senior"
                                ? "bg-white text-[#8B4513] shadow-sm ring-1 ring-gray-200"
                                : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
                                }`}
                        >
                            SENIOR
                        </button>
                    </div>
                </div>
            )}

            {activeView === "team" && (
                <div className="flex justify-center px-4 overflow-x-auto no-scrollbar pb-2">
                    <div className="bg-white/50 backdrop-blur-md p-1 rounded-2xl border border-gray-200/50 flex gap-1 whitespace-nowrap">
                        <button
                            onClick={() => setActiveCategory("general")}
                            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeCategory === "general"
                                ? "bg-white text-[#8B4513] shadow-sm ring-1 ring-gray-200"
                                : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
                                }`}
                        >
                            GENERAL
                        </button>
                        <button
                            onClick={() => setActiveCategory("hifz")}
                            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeCategory === "hifz"
                                ? "bg-white text-[#8B4513] shadow-sm ring-1 ring-gray-200"
                                : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
                                }`}
                        >
                            HIFZ
                        </button>
                        <button
                            onClick={() => setActiveCategory("junior")}
                            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeCategory === "junior"
                                ? "bg-white text-[#8B4513] shadow-sm ring-1 ring-gray-200"
                                : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
                                }`}
                        >
                            JUNIOR
                        </button>
                        <button
                            onClick={() => setActiveCategory("senior")}
                            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeCategory === "senior"
                                ? "bg-white text-[#8B4513] shadow-sm ring-1 ring-gray-200"
                                : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
                                }`}
                        >
                            SENIOR
                        </button>
                    </div>
                </div>
            )}

            {/* Search Bar - Floating & Elegant */}
            <div className="relative max-w-lg mx-auto px-4 z-10">
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400 group-focus-within:text-[#8B4513] transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder={activeView === "individual" ? `Search ${activeCategory} student, chest no...` : "Search team..."}
                        className="block w-full pl-11 pr-4 py-3.5 bg-white/80 backdrop-blur-md border border-gray-200/50 rounded-2xl text-sm shadow-sm focus:ring-2 focus:ring-[#8B4513]/20 focus:border-[#8B4513] transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-xs text-gray-400 border border-gray-100 px-2 py-0.5 rounded-md hidden md:block">
                            {activeView === "individual" ? filteredStudents.length : filteredTeams.length} {activeView === "individual" ? "students" : "teams"}
                        </span>
                    </div>
                </div>
            </div>

            {/* Top 3 Podium - Only show if no search filter */}
            {!search && activeView === "individual" && topStudents.length > 0 && renderPodium(topStudents, false)}
            {!search && activeView === "team" && topTeams.length > 0 && renderPodium(topTeams, true)}


            {/* List View - Card Style for Mobile */}
            <div className="px-4 pb-20">
                <div className="max-w-4xl mx-auto space-y-3">
                    {/* INDIVIDUAL LIST */}
                    {activeView === "individual" && (
                        ((search ? filteredStudents : restStudents).length > 0 ? (
                            <AnimatePresence>
                                {(search ? filteredStudents : restStudents).map((student, index) => (
                                    <motion.div
                                        key={student.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="group relative bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex items-center gap-4 overflow-hidden"
                                    >
                                        {/* Rank Badge */}
                                        <div className={`
                                            shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm md:text-base font-bold
                                            ${student.rank === 1 ? 'bg-yellow-100 text-yellow-700 ring-4 ring-yellow-50/50' :
                                                student.rank === 2 ? 'bg-gray-100 text-gray-700 ring-4 ring-gray-50/50' :
                                                    student.rank === 3 ? 'bg-orange-100 text-orange-700 ring-4 ring-orange-50/50' :
                                                        'bg-gray-50 text-gray-500'}
                                        `}>
                                            {student.rank}
                                        </div>

                                        {/* Avatar */}
                                        <div className="shrink-0 relative">
                                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden bg-gray-100 ring-2 ring-white shadow-sm">
                                                {student.avatar ? (
                                                    <Image
                                                        src={student.avatar}
                                                        alt={student.name}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold">
                                                        {student.name[0]}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Details */}
                                        <div className="grow min-w-0">
                                            <h4 className="font-bold text-gray-900 text-sm md:text-base group-hover:text-[#8B4513] transition-colors leading-tight">
                                                {student.name}
                                            </h4>
                                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                <span className="text-xs text-gray-400 font-mono bg-gray-50 px-1.5 rounded whitespace-nowrap">{student.chest_no}</span>
                                                {student.badge_uid && (
                                                    <span className="text-xs text-gray-400 font-mono bg-gray-50 px-1.5 rounded whitespace-nowrap flex items-center gap-1">
                                                        UID: {student.badge_uid}
                                                    </span>
                                                )}
                                                <span className="text-[10px] md:text-xs text-gray-500 border-l border-gray-200 pl-2 leading-tight">
                                                    {student.teamName}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Points */}
                                        <div className="shrink-0 text-right pl-2">
                                            <div className="font-black text-gray-900 text-base md:text-xl">
                                                {student.total_points}
                                            </div>
                                            <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Points</div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        ) : (
                            <div className="text-center py-12 text-gray-500 bg-white/50 rounded-3xl border border-dashed border-gray-200">
                                No students found
                            </div>
                        ))
                    )}

                    {/* TEAM LIST */}
                    {activeView === "team" && (
                        ((search ? filteredTeams : restTeams).length > 0 ? (
                            <AnimatePresence>
                                {(search ? filteredTeams : restTeams).map((team, index) => (
                                    <motion.div
                                        key={team.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="group relative bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex items-center gap-4 overflow-hidden"
                                    >
                                        {/* Rank Badge */}
                                        <div className={`
                                            shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm md:text-base font-bold
                                            ${team.rank === 1 ? 'bg-yellow-100 text-yellow-700 ring-4 ring-yellow-50/50' :
                                                team.rank === 2 ? 'bg-gray-100 text-gray-700 ring-4 ring-gray-50/50' :
                                                    team.rank === 3 ? 'bg-orange-100 text-orange-700 ring-4 ring-orange-50/50' :
                                                        'bg-gray-50 text-gray-500'}
                                        `}>
                                            {team.rank}
                                        </div>

                                        {/* Avatar */}
                                        <div className="shrink-0 relative">
                                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden bg-gray-100 ring-2 ring-white shadow-sm">
                                                {team.leader_photo ? (
                                                    <Image
                                                        src={team.leader_photo}
                                                        alt={team.name}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold" style={{ backgroundColor: team.color + '20', color: team.color }}>
                                                        {team.name[0]}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Details */}
                                        <div className="grow min-w-0">
                                            <h4 className="font-bold text-gray-900 text-sm md:text-base group-hover:text-[#8B4513] transition-colors leading-tight">
                                                {team.name}
                                            </h4>
                                            {/* Optional: Add more details like leader name if needed */}
                                        </div>

                                        {/* Points */}
                                        <div className="shrink-0 text-right pl-2">
                                            <div className="font-black text-gray-900 text-base md:text-xl">
                                                {team.total_points}
                                            </div>
                                            <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Points</div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        ) : (
                            <div className="text-center py-12 text-gray-500 bg-white/50 rounded-3xl border border-dashed border-gray-200">
                                No teams found
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
