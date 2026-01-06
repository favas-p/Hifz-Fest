"use client";

import { useState, useMemo } from "react";
import { ProgramsGrid } from "@/components/programs-grid";

import { StudentLeaderboard } from "@/components/student-leaderboard";
import { useResultUpdates } from "@/hooks/use-realtime";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { Program, ResultRecord, Student, Team } from "@/lib/types";

interface ResultsRealtimeProps {
  programs: Program[];
  results: ResultRecord[];
  programMap: Map<string, Program>;
  students: Student[];
  teams: Team[];
}

export function ResultsRealtime({
  programs: initialPrograms,
  results: initialResults,
  programMap: initialProgramMap,
  students,
  teams,
}: ResultsRealtimeProps) {
  const [activeTab, setActiveTab] = useState<"all" | "section" | "leaderboard">("all");
  const router = useRouter();

  const tabs = [
    { id: "all", label: "All Programs" },

    { id: "leaderboard", label: "Leaderboard" },
  ] as const;

  useResultUpdates(() => {
    router.refresh();
  });

  // Calculate students for leaderboard excluding Hifz points
  const leaderboardStudents = useMemo(() => {
    // 1. Calculate points from Hifz programs for each student
    const hifzPoints = new Map<string, number>();

    initialResults.forEach((result) => {
      const program = initialProgramMap.get(result.program_id);
      if (!program) return;

      const isHifz = program.section === "hifz" || program.name.toLowerCase().includes("hifz");

      if (isHifz) {
        result.entries.forEach((entry) => {
          if (entry.student_id && entry.score) {
            const current = hifzPoints.get(entry.student_id) || 0;
            hifzPoints.set(entry.student_id, current + entry.score);
          }
        });
      }
    });

    // 2. Return students with adjusted scores
    return students.map((s) => ({
      ...s,
      total_points: Math.max(0, s.total_points - (hifzPoints.get(s.id) || 0)),
    }));
  }, [students, initialResults, initialProgramMap]);

  return (
    <div className="min-h-screen bg-[#fffcf5]">
      {/* Tab Navigation */}
      <div className="relative pt-4 pb-2">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-start md:justify-center gap-2 md:gap-4 py-4 overflow-x-auto no-scrollbar w-full whitespace-nowrap">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative px-4 py-2 md:px-6 md:py-3 rounded-full md:rounded-2xl font-semibold transition-all duration-300 flex-shrink-0 text-sm md:text-base selection:bg-transparent
                  ${activeTab === tab.id
                    ? "text-[#8B4513] bg-[#8B4513]/10"
                    : "text-gray-500 hover:text-[#8B4513] hover:bg-[#8B4513]/5"
                  }
                `}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 rounded-full md:rounded-2xl border-2 border-[#8B4513]/20"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-8">
        {activeTab === "all" && (
          <ProgramsGrid
            programs={initialPrograms}
            results={initialResults}
            programMap={initialProgramMap}
            students={students}
            teams={teams}
          />
        )}


        {activeTab === "leaderboard" && (
          <div className="container mx-auto px-4 py-8 max-w-5xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-12 text-center"
            >
              <h2 className="text-3xl font-bold text-[#8B4513] mb-2">Leaderboard</h2>
              <p className="text-gray-600">Top performers across all events</p>
            </motion.div>
            <StudentLeaderboard
              students={leaderboardStudents}
              teams={teams}
              results={initialResults}
              programMap={initialProgramMap}
            />
          </div>
        )}
      </div>
    </div>
  );
}










