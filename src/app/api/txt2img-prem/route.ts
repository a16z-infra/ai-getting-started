import dotenv from "dotenv";
import { NextResponse } from "next/server";
import OpenAI from "openai";

dotenv.config({ path: `.env.local` });

const openai = new OpenAI({
    apiKey: "random-string",
    baseURL: process.env.STABLE_DIFFUSION_BASE_URL || "http://localhost:9111/v1"
});

export async function POST(request: Request) {
  const { prompt } = await request.json();
  try{
    const response = await openai.images.generate({
        prompt: prompt,
        n: 1,
        size: "1024x1024",
      });
    return NextResponse.json(response);
  }
  catch(error:any){
    return NextResponse.json({error:error.message},{status:500});
  }

}
