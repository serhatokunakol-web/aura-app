import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const { image } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) return NextResponse.json({ error: "API Key bulunamadı" }, { status: 500 });

    const genAI = new GoogleGenerativeAI(apiKey);
    // Tier 1 (Ücretsiz) katmanında en stabil çalışan model:
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // --- YENİ EKLEDİĞİN GÜVENLİ DATA KISMI BURASI ---
    const base64Data = image.includes(",") ? image.split(",")[1] : image;
    
    const result = await model.generateContent([
      "Analyze this outfit. Return ONLY a JSON object with: auraScore (number), vibeLabel (string), and roast (string). Do not include any markdown or extra text.",
      { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
    ]);
    // -----------------------------------------------

    const response = await result.response;
    let text = response.text().trim();
    
    // JSON dışındaki gereksiz metinleri temizleyen Regex
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return NextResponse.json(JSON.parse(jsonMatch[0]));
    }
    
    throw new Error("Geçersiz JSON formatı");
  } catch (error) {
    console.error("Detaylı Hata:", error);
    return NextResponse.json({ error: "Analiz sırasında hata oluştu" }, { status: 500 });
  }
}