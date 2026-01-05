export type GradeType = "A" | "B" | "C" | "none";

export const GRADE_BONUS: Record<Exclude<GradeType, "none">, number> = {
    A: 5,
    B: 3,
    C: 1,
};

export const GROUP_SCORES: Record<1 | 2 | 3, number> = {
    1: 10,
    2: 8,
    3: 6,
};

export const INDIVIDUAL_SCORES: Record<1 | 2 | 3, number> = {
    1: 5,
    2: 3,
    3: 1,
};

export function calculateScore(
    type: "single" | "group",
    position: 1 | 2 | 3,
    grade: GradeType = "none",
): number {
    if (type === "single") {
        // Individual events: 5, 3, 1 + Grade Bonus
        const base = INDIVIDUAL_SCORES[position] || 0;
        const bonus = grade !== "none" ? GRADE_BONUS[grade] : 0;
        return base + bonus;
    }

    // Group events: 10, 8, 6 + Grade Bonus
    const base = GROUP_SCORES[position] || 0;
    const bonus = grade !== "none" ? GRADE_BONUS[grade] : 0;
    return base + bonus;
}
