import dotenv from "dotenv";
import Replicate from "replicate";
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import arcjet, { shield, fixedWindow, detectBot } from "@arcjet/next";

dotenv.config({ path: `.env.local` });

// The arcjet instance is created outside of the handler
const aj = arcjet({
  key: process.env.ARCJET_KEY!, // Get your site key from https://app.arcjet.com
  rules: [
    // Arcjet Shield protects against common attacks e.g. SQL injection
    shield({
      mode: "LIVE",
    }),
    // Create a fixed window rate limit. Other algorithms are supported.
    fixedWindow({
      mode: "LIVE", // will block requests. Use "DRY_RUN" to log only
      characteristics: ["userId"], // Rate limit based on the Clerk userId
      window: "60s", // 60 second fixed window
      max: 10, // allow a maximum of 10 requests
    }),
    // Blocks all automated clients
    detectBot({
      mode: "LIVE", // will block requests. Use "DRY_RUN" to log only
      block: ["AUTOMATED"],
    }),
  ],
});

export async function POST(request: Request) {
  // Get the current user from Clerk
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Use Arcjet to protect the route
  const decision = await aj.protect(request, { userId: user.id });

  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      return NextResponse.json(
        {
          error: "Too Many Requests",
          reason: decision.reason,
        },
        {
          status: 429,
        },
      );
    } else if (decision.reason.isBot()) {
      return NextResponse.json(
        {
          error: "Bots are not allowed",
          reason: decision.reason,
        },
        {
          status: 403,
        },
      );
    } else {
      return NextResponse.json(
        {
          error: "Unauthorized",
          reason: decision.reason,
        },
        {
          status: 401,
        },
      );
    }
  }

  const { prompt } = await request.json();
  const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN || "",
  });
  try {
    const output = await replicate.run(
      "stability-ai/stable-diffusion:db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf",
      {
        input: {
          prompt,
        },
      },
    );
    return NextResponse.json(output);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
