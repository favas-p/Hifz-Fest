"use server";

import { getResultAnalytics } from "@/lib/result-analytics";

export async function getResultAnalyticsAction() {
    return await getResultAnalytics();
}
