"use server";

import { z } from "zod";
import { hash } from "bcryptjs";
import { connectDB } from "./db";
import { TeamModel } from "./models";
import { cookies } from "next/headers";
import { sign } from "jsonwebtoken";
import { JWT_SECRET, TEAM_COOKIE } from "./config";
import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";

// Validation Schema
const RegisterTeamSchema = z.object({
    name: z.string().min(3, "Institute name must be at least 3 characters"),
    place: z.string().min(2, "Place is required"),
    district: z.string().min(2, "District is required"),
    whatsapp_number: z.string().min(10, "Valid WhatsApp number is required"),
    union_official_number: z.string().optional(),
    principal_name: z.string().min(3, "Principal's name is required"),
    principal_phone: z.string().min(10, "Principal's phone is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm Password is required"),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

// Distinct color palette for teams
// Distinct color palette for teams (Optimized for dark mode/contrast)
const DISTINCT_COLORS = [
    "#ef4444", "#ea580c", "#d97706", "#ca8a04", "#65a30d",
    "#16a34a", "#059669", "#0d9488", "#0891b2", "#0284c7",
    "#2563eb", "#4f46e5", "#7c3aed", "#9333ea", "#c026d3",
    "#db2777", "#e11d48", "#57534e", "#475569", "#b45309",
    "#3f6212", "#0f766e", "#1e40af", "#6b21a8", "#9f1239"
];

// Helper to parsing hex to RGB
function hexToRgb(hex: string) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

// Calculate color distance (Weighted Euclidean)
function colorDistance(hex1: string, hex2: string) {
    const rgb1 = hexToRgb(hex1);
    const rgb2 = hexToRgb(hex2);
    if (!rgb1 || !rgb2) return 0;

    const rmean = (rgb1.r + rgb2.r) / 2;
    const r = rgb1.r - rgb2.r;
    const g = rgb1.g - rgb2.g;
    const b = rgb1.b - rgb2.b;

    return Math.sqrt((((512 + rmean) * r * r) >> 8) + 4 * g * g + (((767 - rmean) * b * b) >> 8));
}

function isTooLight(hex: string) {
    const r = parseInt(hex.substr(1, 2), 16);
    const g = parseInt(hex.substr(3, 2), 16);
    const b = parseInt(hex.substr(5, 2), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return yiq >= 180; // Threshold: 128 is mid-gray, ~180 excludes distinctively light colors
}

function isSimilar(color1: string, color2: string, threshold = 100) {
    return colorDistance(color1, color2) < threshold;
}

export async function registerTeam(prevState: any, formData: FormData) {
    try {
        const rawData = Object.fromEntries(formData.entries());

        // Validate Input
        const validatedFields = RegisterTeamSchema.safeParse(rawData);

        if (!validatedFields.success) {
            return {
                error: "Validation failed",
                fieldErrors: validatedFields.error.flatten().fieldErrors,
            };
        }

        const {
            name, place, district, whatsapp_number,
            union_official_number, principal_name, principal_phone, password
        } = validatedFields.data;

        await connectDB();

        // Check Duplicate Name
        const existingTeam = await TeamModel.findOne({ name: { $regex: new RegExp(`^${name}$`, "i") } });
        if (existingTeam) {
            return { error: "An institute with this name is already registered." };
        }

        // Hash Password
        const hashedPassword = await hash(password, 10);
        const teamId = `team-${randomUUID().slice(0, 8)}`;

        // Generate Unique Color
        const usedColorsRaw: string[] = await TeamModel.distinct("color");
        let color = "";

        // 1. Try to pick a color from the distinct palette that isn't similar to any used color
        for (const c of DISTINCT_COLORS) {
            const isTooClose = usedColorsRaw.some(used => isSimilar(c, used, 100)); // Threshold 100 is decent for RGB diff
            if (!isTooClose) {
                color = c;
                break;
            }
        }

        // 2. If all palette colors are used or too similar, fallback to a random color
        // Ensure it's not too light AND not similar to existing colors
        if (!color) {
            let isUniqueAndValid = false;
            let attempts = 0;

            while (!isUniqueAndValid && attempts < 100) {
                const randomHex = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
                const candidate = `#${randomHex}`;

                // Check brightness
                if (!isTooLight(candidate)) {
                    // Check similarity
                    const isTooClose = usedColorsRaw.some(used => isSimilar(candidate, used, 80)); // Slightly lower threshold for random
                    if (!isTooClose) {
                        color = candidate;
                        isUniqueAndValid = true;
                    }
                }
                attempts++;
            }

            // Fallback if we fail to find a perfect match
            if (!color) {
                const randomHex = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
                color = `#${randomHex}`;
            }
        }

        // Create Team
        await TeamModel.create({
            id: teamId,
            name,
            // For now, mapping optional fields or defaults for legacy structure
            leader: principal_name, // Using Principal as "Leader" for legacy compatibility
            leader_photo: "/img/default_team_logo.png", // Default placeholder
            color, // Use the generated unique color
            description: `${place}, ${district}`,
            contact: whatsapp_number,
            total_points: 0,
            portal_password: hashedPassword, // Store for redundancy or remove if schema cleanup happens

            // New Specific Fields
            place,
            district,
            whatsapp_number,
            union_official_number,
            principal_name,
            principal_phone
        });

        // Create Session
        const token = sign(
            { id: teamId, name: name, role: "team" },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        const cookieStore = await cookies();
        cookieStore.set(TEAM_COOKIE, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: "/",
        });

    } catch (error: any) {
        console.error("Registration error:", error);
        return { error: "Something went wrong. Please try again." };
    }

    // Redirect on success (outside try-catch to avoid Next.js digest error)
    redirect("/team/dashboard");
}
