import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const { image } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "API Key eksik!" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // Tier 1 (ücretsiz) için en hızlı ve uyumlu model Flash'tır
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = "Act as a ruthless Gen-Z fashion critic. Analyze this outfit and return a JSON with auraScore (number -100 to 100), vibeLabel (short string), and roast (sharp text). Output ONLY the raw JSON.";

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: image.split(",")[1],
          mimeType: "image/jpeg",
        },
      },
    ]);

    const response = await result.response;
    let text = response.text();
    
    // JSON dışındaki olası Markdown işaretlerini temizleyelim
    text = text.replace(/```json|```/g, "").trim();
    
    return NextResponse.json(JSON.parse(text));
  } catch (error) {
    console.error("Analiz Hatası:", error);
    return NextResponse.json({ error: "Analiz yapılamadı, lütfen tekrar deneyin." }, { status: 500 });
  }
}