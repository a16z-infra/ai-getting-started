import dotenv from "dotenv";
import Replicate from "replicate";
import { NextResponse } from "next/server";
import { wrapApiHandlerWithSentry } from "@sentry/nextjs";

dotenv.config({ path: `.env.local` });

async function HandlePost(request: Request) {
  const { prompt } = await request.json();
  const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN || "",
  });

  const output = await replicate.run(
    "stability-ai/stable-diffusion:db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf",
    {
      input: {
        prompt,
      },
    }
  );

  return NextResponse.json(output);
}

export const POST = wrapApiHandlerWithSentry(HandlePost, "txt2img");
