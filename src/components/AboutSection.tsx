"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Palette, Sparkles, Scale, Activity, ArrowRight, Scroll, Star } from "lucide-react";
import Link from "next/link";

const features = [
    {
        title: "Living Heritage",
        description: "Celebrating art forms that have crossed centuries, weaving the past into the present.",
        icon: Palette,
        color: "bg-amber-100 text-amber-700",
        delay: 0.1,
    },
    {
        title: "Rising Stars",
        description: "A premier stage for the next generation to showcase talent and creative brilliance.",
        icon: Star,
        color: "bg-rose-100 text-rose-700",
        delay: 0.2,
    },
    {
        title: "Integrity in Art",
        description: "Every stroke and score is evaluated with codified transparency and fairness.",
        icon: Scale,
        color: "bg-emerald-100 text-emerald-700",
        delay: 0.3,
    },
    {
        title: "Pulse of the Event",
        description: "Real-time connection to every heartbeat of the fiesta, shrinking the distance.",
        icon: Activity,
        color: "bg-blue-100 text-blue-700",
        delay: 0.4,
    },
];

export function AboutSection() {
    return (
        <section className="relative py-20 md:py-32 overflow-hidden bg-[#FFFCF5]">
            {/* Decorative Background Elements */}
            <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-amber-500/5 to-transparent pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#8B4513]/5 rounded-full blur-[100px] pointer-events-none" />

            {/* Islamic Geometric Pattern Overlay (CSS Pattern) */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(#8B4513 1px, transparent 1px)', backgroundSize: '32px 32px' }}>
            </div>

            <div className="container mx-auto px-4 md:px-6 relative z-10 max-w-7xl">
                <div className="flex flex-col lg:flex-row gap-16 lg:gap-24 items-start">

                    {/* Narrative Side (Left) */}
                    <div className="flex-1 space-y-8 lg:sticky lg:top-32">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                        >
                            <span className="inline-flex items-center rounded-full border mb-6 py-1.5 px-4 text-sm font-medium border-[#8B4513]/20 text-[#8B4513] bg-white shadow-sm">
                                <Scroll className="w-3.5 h-3.5 mr-2" /> Our Legacy & Vision
                            </span>

                            <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif text-[#3A2D28] leading-[1.1] mb-6">
                                Where <span className="text-[#8B4513]">Faith</span> Inspires <span className="italic font-light">Excellence</span>
                            </h2>

                            <div className="space-y-6 text-lg text-gray-600 leading-relaxed font-light">
                                <p>
                                    More than a celebration, <strong className="text-[#8B4513] font-medium">Hifz Fest</strong> is a living
                                    expression of devotion to the Holy Quran. Hosted at Jamia Nooriya under the guidance of CCQS,
                                    the festival honors a legacy where knowledge, discipline, and faith grow together.
                                </p>
                                <p>
                                    Bringing together over a hundred students from multiple institutions, Hifz Fest creates a
                                    refined platform for Quran memorization, recitation, and Quran-inspired creativity—bridging
                                    centuries of Malabar’s Quranic tradition with a new generation of learners.
                                </p>
                            </div>


                            <div className="pt-4">
                                <Link href="https://www.noorululama.org/">
                                    <Button variant="outline" className="group border-[#8B4513] text-[#8B4513] hover:bg-[#8B4513] hover:text-white transition-all duration-300 rounded-full px-8 py-6 text-base">
                                        Discover Our Story <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </Link>
                            </div>
                        </motion.div>
                    </div>

                    {/* Feature Grid Side (Right) */}
                    <div className="flex-1 w-full">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {features.map((feature, idx) => {
                                const Icon = feature.icon;
                                return (
                                    <motion.div
                                        key={feature.title}
                                        initial={{ opacity: 0, y: 30 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.5, delay: feature.delay }}
                                        className={`group relative p-8 rounded-3xl bg-white border border-[#E5E0D8] shadow-sm hover:shadow-xl hover:border-[#8B4513]/20 transition-all duration-300 hover:-translate-y-1 ${idx % 2 === 1 ? 'md:translate-y-12' : ''}`}
                                    >
                                        <div className={`w-14 h-14 rounded-2xl ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-inner`}>
                                            <Icon className="w-7 h-7" />
                                        </div>

                                        <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-[#8B4513] transition-colors font-serif">
                                            {feature.title}
                                        </h3>

                                        <p className="text-gray-600 leading-relaxed text-sm">
                                            {feature.description}
                                        </p>

                                        {/* Hover Decoration */}
                                        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-[#8B4513]/0 via-[#8B4513]/0 to-[#8B4513]/0 group-hover:via-[#8B4513]/40 transition-all duration-500" />
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
