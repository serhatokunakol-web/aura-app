import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

type AuraApiResponse = {
  auraScore: number;
  vibeLabel: string;
  roast: string;
};

export async function POST(req: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured on the server." },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => null);

    if (!body || typeof body.imageBase64 !== "string") {
      return NextResponse.json(
        { error: "Invalid request. Expected JSON body with imageBase64 string." },
        { status: 400 }
      );
    }

    const imageBase64 = body.imageBase64 as string;

    const systemPrompt = `
You are "Aura & Vibe Analyzer", a ruthless, hyper-online Gen Z fashion critic.

Rules:
- You must analyze the person's OUTFIT from the photo only (not their face or body).
- Your tone is sarcastic, savage, and drenched in internet/fashion culture.
- Use references like "Old Money try-hard", "Sanayi E-boy", "NPC", "TikToker", "Tech bro", "starboy", "main character", "background character", etc. when relevant.
- You are roasting for fun, not giving gentle feedback.

Response format (IMPORTANT):
- You MUST respond with STRICT JSON ONLY.
- No markdown, no backticks, no additional text.
- Use EXACTLY these 3 fields:
  - auraScore: number between -100 and 100 (can be negative, decimals allowed but prefer integers).
  - vibeLabel: short, funny string capturing the vibe (max ~8 words).
  - roast: 2-3 sentences of harsh, humorous critique.
`.trim();

    const userPrompt = `
Look at this outfit photo and:
- Judge the overall aesthetic, styling, and vibe.
- Decide what kind of internet archetype this person is serving.
- Then return ONLY the JSON with auraScore, vibeLabel, and roast as specified.
`.trim();

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro",
    });

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            { text: `${systemPrompt}\n\n${userPrompt}` },
            {
              inlineData: {
                data: imageBase64,
                mimeType: "image/jpeg",
              },
            },
          ],
        },
      ],
    });

    const raw =
      result.response.candidates?.[0]?.content?.parts
        ?.map((p: any) => p.text ?? "")
        .join("") ?? "";

    if (!raw || typeof raw !== "string") {
      return NextResponse.json(
        { error: "No response from Gemini." },
        { status: 502 }
      );
    }

    let parsed: AuraApiResponse | null = null;

    try {
      parsed = JSON.parse(raw as unknown as string) as AuraApiResponse;
    } catch {
      // Try to salvage any JSON substring if the model misbehaves
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) {
        throw new Error("Gemini returned non-JSON content.");
      }
      parsed = JSON.parse(match[0]) as AuraApiResponse;
    }

    if (
      !parsed ||
      typeof parsed.auraScore !== "number" ||
      typeof parsed.vibeLabel !== "string" ||
      typeof parsed.roast !== "string"
    ) {
      return NextResponse.json(
        { error: "Gemini returned an unexpected format." },
        { status: 502 }
      );
    }

    // Clamp to -100..100 just in case
    const clampedScore = Math.max(-100, Math.min(100, parsed.auraScore));

    const safeResponse: AuraApiResponse = {
      auraScore: clampedScore,
      vibeLabel: parsed.vibeLabel.trim(),
      roast: parsed.roast.trim(),
    };

    return NextResponse.json(safeResponse);
  } catch (error) {
    console.error("Error in /api/analyze:", error);
    return NextResponse.json(
      {
        error: "Failed to analyze image. Please try again.",
      },
      { status: 500 }
    );
  }
}

