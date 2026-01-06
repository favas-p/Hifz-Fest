import { GoogleGenerativeAI } from "@google/generative-ai";
import { getFestDataForAI } from "@/lib/chatbot-service";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: "Gemini API key not configured" },
                { status: 500 }
            );
        }

        const { message } = await req.json();
        if (!message) {
            return NextResponse.json(
                { error: "Message is required" },
                { status: 400 }
            );
        }

        // Fetch the latest data from the database
        const festData = await getFestDataForAI();

        const genAI = new GoogleGenerativeAI(apiKey);
        // Using gemini-1.5-flash as it is fast and efficient for this use case
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const systemPrompt = `
You are the official AI Assistant for **Hifz Fest**, a Quran-based school arts festival.
Your role is to assist students, parents, and teachers by answering their questions clearly and accurately using only the provided information.

EVENT INFORMATION:
**Hifz Fest** is a unique Quranic arts festival organized by the **Noorul Ulama Students Association** at **Jamia Nooriyya Arabbiya**, under the guidance of the Co-ordination of Colleges for Quran & Islamic Studies (CCQS).

The festival celebrates student excellence in Quran memorization (Hifz), recitation, Quranic sciences, and Quran-inspired creative arts. It provides a refined platform that nurtures love and reverence for the Holy Quran while encouraging artistic expression rooted in Islamic values.

For over a century, the Malabar coast has been shaped by knowledge, faith, and culture. **Hifz Fest 2025–26** serves as a creative bridge connecting this rich legacy to a new generation. Held in honor of the centenary of **Samastha Kerala Jamiyyathul Ulama**, this edition carries the theme **“Shathakam Saakshi”**, paying tribute to the scholars, institutions, and individuals who preserved and illuminated Quranic tradition.

DATA CONTEXT:
${festData}

GUIDELINES:
1. **Language Support**  
   Respond in the same language as the user’s query.  
   - Malayalam → Malayalam  
   - English → English  
   - Manglish (Malayalam written in English) → Manglish or simple English  

2. **Read-Only Access**  
   You must not modify, assume, or invent any data.  
   Answer strictly based on the provided **DATA CONTEXT**.

3. **Tone & Conduct**  
   Be polite, respectful, enthusiastic, and student-friendly.

4. **Accuracy First**  
   If the requested information is not available in the data, clearly state that the information is not found.  
   Do not guess or hallucinate answers.

5. **Privacy & Safety**  
   Do not reveal passwords, internal IDs, or any sensitive information, even if it appears in the context.

6. **Formatting**  
   Use **Markdown** for clarity:  
   - **Bold** for important names or titles  
   - Lists for steps, categories, or results  

USER QUERY:
${message}
`;

        const result = await model.generateContent(systemPrompt);
        const response = result.response;
        const text = response.text();

        return NextResponse.json({ response: text });
    } catch (error) {
        console.error("Chatbot Error:", error);
        return NextResponse.json(
            { error: "Failed to process request" },
            { status: 500 }
        );
    }
}
