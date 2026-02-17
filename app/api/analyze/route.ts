import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    // Frontend'den gelen veriyi alıyoruz
    const body = await req.json();
    const image = body.image || body.imageBase64; // Her iki isimlendirme ihtimaline karşı güvenli kontrol
    
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error("KRİTİK HATA: Vercel üzerinde GEMINI_API_KEY tanımlı değil!");
      return NextResponse.json({ error: "Sistem ayarları eksik" }, { status: 500 });
    }

    if (!image) {
      return NextResponse.json({ error: "Görsel verisi gönderilmedi" }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // 404 hatasını aşmak için en güncel ve stabil model:
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Base64 verisinin başındaki "data:image/..." kısmını temizleyen QA onaylı temizlik:
    const base64Data = image.includes(",") ? image.split(",")[1] : image;

    const result = await model.generateContent([
      "Analyze this outfit. Return ONLY a JSON object with: auraScore (number), vibeLabel (string), and roast (string). Be direct, witty and sharp. No markdown or extra text.",
      {
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg",
        },
      },
    ]);

    const response = await result.response;
    const text = response.text().trim();
    
    // Google bazen ```json ... ``` içinde dönebilir, bunu temizleyen Regex:
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return NextResponse.json(JSON.parse(jsonMatch[0]));
    }
    
    console.error("HATA: Google'dan geçersiz format geldi:", text);
    throw new Error("JSON Format Hatası");

  } catch (error: any) {
    console.error("KRİTİK ANALİZ HATASI:", error.message || error);
    return NextResponse.json(
      { error: "Analiz sırasında bir sorun oluştu." }, 
      { status: 500 }
    );
  }
}