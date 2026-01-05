import { Metadata } from "next";
import { PointCalculator } from "@/components/admin/point-calculator";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
    title: "Point Calculator | Admin",
    description: "Pre-calculate points for different scenarios.",
};

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DetailedAnalytics } from "@/components/admin/detailed-analytics";

export default function PointCalculatorPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/admin/dashboard">
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Point Manager</h1>
                    <p className="text-sm text-gray-500">
                        Calculate points and view comprehensive result analytics.
                    </p>
                </div>
            </div>

            <Tabs defaultValue="analytics" className="w-full flex flex-col items-center">
                <TabsList className="bg-white/5 border border-white/10 p-1 h-auto rounded-full w-fit">
                    <TabsTrigger value="calculator" className="rounded-full px-6 py-2.5 data-[state=active]:bg-white/10 data-[state=active]:text-white transition-all">Pre-Calculator</TabsTrigger>
                    <TabsTrigger value="analytics" className="rounded-full px-6 py-2.5 data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 data-[state=active]:border-emerald-500/20 data-[state=active]:border transition-all">Analytics (All Results)</TabsTrigger>
                </TabsList>

                <TabsContent value="calculator" className="mt-6 w-full">
                    <PointCalculator />
                </TabsContent>

                <TabsContent value="analytics" className="mt-6 w-full">
                    <DetailedAnalytics />
                </TabsContent>
            </Tabs>
        </div>
    );
}
