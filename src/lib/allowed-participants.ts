import fs from "fs";
import path from "path";

export interface AllowedParticipant {
    uid: string;
    name: string;
}

let cachedParticipants: AllowedParticipant[] | null = null;

export async function getAllowedParticipants(): Promise<AllowedParticipant[]> {
    if (cachedParticipants) return cachedParticipants;

    try {
        const filePath = path.join(process.cwd(), "Hifz Fesst Data.csv");
        const fileContent = await fs.promises.readFile(filePath, "utf-8");

        // Parse CSV
        const lines = fileContent.split(/\r?\n/);
        const participants: AllowedParticipant[] = [];

        // Skip header (line 1)
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // Handle potential commas in name if any, but simplistic split usually works for simple CSVs
            // The file seems to have "UID ,Students Name" header and simple values
            const parts = line.split(",");
            if (parts.length >= 2) {
                const uid = parts[0].trim();
                // Join the rest in case name has commas (simple strategy)
                const name = parts.slice(1).join(",").trim();

                if (uid && name) {
                    participants.push({ uid, name });
                }
            }
        }

        cachedParticipants = participants;
        return participants;
    } catch (error) {
        console.error("Error reading allowed participants CSV:", error);
        return [];
    }
}

export async function findParticipantByUid(uid: string): Promise<AllowedParticipant | undefined> {
    const participants = await getAllowedParticipants();
    // Case insensitive check for UID? Assuming CSV has uppercase UIDs like HQ0001
    return participants.find(p => p.uid.toLowerCase() === uid.toLowerCase());
}
