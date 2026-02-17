import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const { image } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error("KRİTİK HATA: GEMINI_API_KEY tanımlı değil!");
      return NextResponse.json({ error: "Sistem hatası: API Key eksik" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // 404 hatasını önlemek için en güncel stabil model:
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Base64 temizliği (Header varsa atar, yoksa dokunmaz)
    const base64Data = image.includes(",") ? image.split(",")[1] : image;

    const result = await model.generateContent([
      "Analyze this outfit. Return ONLY a JSON object: {auraScore: number, vibeLabel: string, roast: string}. Be witty, sharp and direct.",
      {
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg",
        },
      },
    ]);

    const text = result.response.text().trim();
    
    // JSON'ı temizleyen Regex (Güvenlik katmanı)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return NextResponse.json(JSON.parse(jsonMatch[0]));
    }
    
    throw new Error("Geçersiz format");

  } catch (error: any) {
    console.error("KRİTİK ANALİZ HATASI:", error.message || error);
    return NextResponse.json(
      { error: "Analiz başarısız oldu. Lütfen tekrar deneyin." }, 
      { status: 500 }
    );
  }
}