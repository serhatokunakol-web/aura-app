import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const { image } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Key missing" }, { status: 500 });

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Tier 1 için en hızlısı budur

    const result = await model.generateContent([
      "Act as a ruthless Gen-Z fashion critic. Analyze this outfit. Return ONLY a JSON: {auraScore: number, vibeLabel: string, roast: string}",
      { inlineData: { data: image.split(",")[1], mimeType: "image/jpeg" } }
    ]);

    const text = result.response.text().replace(/```json|```/g, "").trim();
    return NextResponse.json(JSON.parse(text));
  } catch (error) {
    console.error("Analiz Hatası:", error);
    return NextResponse.json({ error: "Analiz başarısız" }, { status: 500 });
  }
}