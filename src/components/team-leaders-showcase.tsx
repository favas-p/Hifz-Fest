"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Crown } from "lucide-react";
import type { Team } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TeamLeadersShowcaseProps {
  teams: Team[];
}

const TEAM_IMAGES: Record<string, string> = {
  "SAMARQAND": "/img/teams/SAMARKAND.png",
  "NAHAVAND": "/img/teams/NAHAVAND.png",
  "YAMAMA": "/img/teams/YAMAMAH.png",
  "QURTUBA": "/img/teams/QURTHUBA.png",
  "MUQADDAS": "/img/teams/MUQADDAS.png",
  "BUKHARA": "/img/teams/BUKHARA.png",
};

export function TeamLeadersShowcase({ teams }: TeamLeadersShowcaseProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const handleNext = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % teams.length);
  }, [teams.length]);

  const handlePrev = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev === 0 ? teams.length - 1 : prev - 1));
  }, [teams.length]);

  // Auto-play
  useEffect(() => {
    const timer = setInterval(() => {
      handleNext();
    }, 5000);
    return () => clearInterval(timer);
  }, [handleNext]);

  const getImage = (teamName: string) => {
    // Normalize string to match keys (uppercase)
    const normalized = teamName.toUpperCase();
    return TEAM_IMAGES[normalized];
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.8,
      zIndex: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      zIndex: 1,
      transition: {
        duration: 0.5,
        type: "spring" as const,
        stiffness: 300,
        damping: 30
      }
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
      scale: 0.8,
      zIndex: 0,
      transition: {
        duration: 0.5,
      }
    })
  };

  return (
    <section className="py-12 sm:py-20 relative overflow-hidden bg-white ">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 border border-orange-100/50 shadow-sm"
          >
            <Crown className="w-4 h-4 text-[#8B4513]" />
            <span className="text-xs font-bold tracking-[0.2em] text-[#8B4513] uppercase">Team Captains</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-serif text-gray-900 tracking-tight"
          >
            Meet The <span className="text-[#8B4513]">Leaders</span>
          </motion.h2>
        </div>

        {/* Carousel */}
        <div className="relative max-w-5xl mx-auto h-[400px] sm:h-[500px] flex items-center justify-center perspective-1000">

          {/* Navigation Buttons */}
          <button
            onClick={handlePrev}
            className="hidden sm:flex absolute left-4 z-20 p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-lg hover:bg-white text-gray-800 transition-all hover:scale-110 items-center justify-center"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={handleNext}
            className="hidden sm:flex absolute right-4 z-20 p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-lg hover:bg-white text-gray-800 transition-all hover:scale-110 items-center justify-center"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={1}
              onDragEnd={(e, { offset, velocity }) => {
                const swipe = Math.abs(offset.x) * velocity.x;
                const swipeConfidenceThreshold = 10000;
                if (swipe < -swipeConfidenceThreshold) {
                  handleNext();
                } else if (swipe > swipeConfidenceThreshold) {
                  handlePrev();
                }
              }}
              className="absolute w-full max-w-sm sm:max-w-md md:max-w-lg aspect-3/4 sm:aspect-4/5 md:aspect-square flex items-center justify-center touch-pan-y cursor-grab active:cursor-grabbing"
            >
              <div className="relative w-full h-full drop-shadow-2xl hover:scale-[1.02] transition-transform duration-500">
                <Image
                  src={getImage(teams[currentIndex]?.name || "")}
                  alt={teams[currentIndex]?.name || "Team Captain"}
                  fill
                  className="object-contain pointer-events-none"
                  priority
                />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Pagination Dots */}
        <div className="flex justify-center items-center gap-3 mt-6 h-6">
          <AnimatePresence mode="popLayout" initial={false}>
            {[
              (currentIndex - 1 + teams.length) % teams.length,
              currentIndex,
              (currentIndex + 1) % teams.length,
            ].map((idx) => {
              const isCurrent = idx === currentIndex;
              return (
                <motion.div
                  layout
                  key={`dot-${idx}`}
                  onClick={() => {
                    if (isCurrent) return;
                    const isNext = idx === (currentIndex + 1) % teams.length;
                    setDirection(isNext ? 1 : -1);
                    setCurrentIndex(idx);
                  }}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{
                    scale: 1,
                    opacity: 1,
                    backgroundColor: isCurrent ? "#8B4513" : "#D1D5DB",
                  }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{
                    duration: 0.3,
                    type: "spring",
                    stiffness: 300,
                    damping: 25
                  }}
                  className={cn(
                    "rounded-full cursor-pointer shrink-0",
                    isCurrent ? "w-3 h-3 shadow-md z-10" : "w-1.5 h-1.5 hover:bg-gray-400"
                  )}
                />
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
