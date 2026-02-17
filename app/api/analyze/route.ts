import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const { image } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;
    
    // API Key kontrolü
    if (!apiKey) {
      console.error("HATA: GEMINI_API_KEY Vercel üzerinde tanımlı değil!");
      return NextResponse.json({ error: "Sistem ayarları eksik" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // 1.5-pro yerine garanti olması için 1.5-flash kullanıyoruz
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const base64Data = image.includes(",") ? image.split(",")[1] : image;

    const result = await model.generateContent([
      "Analyze this outfit. Return ONLY JSON: {auraScore: number, vibeLabel: string, roast: string}",
      { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
    ]);

    const text = result.response.text().trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return NextResponse.json(JSON.parse(jsonMatch[0]));
    }
    
    console.error("HATA: Google'dan gelen cevap JSON formatında değil:", text);
    throw new Error("Format hatası");

  } catch (error: any) {
    // Vercel loglarında hatanın detayını görmek için:
    console.error("KRİTİK ANALİZ HATASI:", error.message || error);
    return NextResponse.json({ error: "Analiz başarısız" }, { status: 500 });
  }
}