import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const { image } = await req.json();
    
    // API KEY kontrolü
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API Key is missing" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = "Act as a ruthless Gen-Z fashion critic. Analyze this outfit and return a JSON with auraScore (number -100 to 100), vibeLabel (short string), and roast (sharp text). Output ONLY the JSON.";

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: image.split(",")[1], mimeType: "image/jpeg" } }
    ]);

    const text = result.response.text();
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}') + 1;
    const jsonData = JSON.parse(text.slice(jsonStart, jsonEnd));

    return NextResponse.json(jsonData);
  } catch (error) {
    console.error("Analysis Error:", error);
    return NextResponse.json({ error: "Failed to analyze image" }, { status: 500 });
  }
}