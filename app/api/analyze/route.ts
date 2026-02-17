import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const { image } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error("HATA: API Anahtarı eksik!");
      return NextResponse.json({ error: "Sistem ayarları eksik" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // 404 hatasını önlemek için en güncel model:
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Base64 verisindeki başlığı (data:image/jpeg;base64,) temizliyoruz
    const base64Data = image.includes(",") ? image.split(",")[1] : image;

    const result = await model.generateContent([
      "Analyze this outfit. Return ONLY a JSON object with: auraScore (number), vibeLabel (string), and roast (string). Be creative and direct. No markdown formatting.",
      {
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg",
        },
      },
    ]);

    const response = await result.response;
    const text = response.text().trim();
    
    // JSON dışındaki metinleri temizleyen Regex (QA onaylı güvenlik katmanı)
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