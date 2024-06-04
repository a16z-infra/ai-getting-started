import { SupabaseVectorStore } from "langchain/vectorstores/supabase";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { createClient } from "@supabase/supabase-js";
import { OpenAI } from "langchain/llms/openai";
import dotenv from "dotenv";
import { VectorDBQAChain } from "langchain/chains";
import { StreamingTextResponse, LangChainStream } from "ai";
import { CallbackManager } from "langchain/callbacks";
import { currentUser } from "@clerk/nextjs";
import arcjet, { shield, fixedWindow, detectBot } from "@arcjet/next";
import { NextResponse } from "next/server";

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

export async function POST(req: Request) {
  // Get the current user from Clerk
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Use Arcjet to protect the route
  const decision = await aj.protect(req, { userId: user.id });

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

  const { prompt } = await req.json();

  const privateKey = process.env.SUPABASE_PRIVATE_KEY;
  if (!privateKey) throw new Error(`Expected env var SUPABASE_PRIVATE_KEY`);

  const url = process.env.SUPABASE_URL;
  if (!url) throw new Error(`Expected env var SUPABASE_URL`);

  const auth = {
    detectSessionInUrl: false,
    persistSession: false,
    autoRefreshToken: false,
  };
  const client = createClient(url, privateKey, { auth });

  const vectorStore = await SupabaseVectorStore.fromExistingIndex(
    new OpenAIEmbeddings({ openAIApiKey: process.env.OPENAI_API_KEY }),
    {
      client,
      tableName: "documents",
      queryName: "match_documents",
    },
  );

  const { stream, handlers } = LangChainStream();

  const model = new OpenAI({
    streaming: true,
    modelName: "gpt-3.5-turbo-16k",
    openAIApiKey: process.env.OPENAI_API_KEY,
    callbackManager: CallbackManager.fromHandlers(handlers),
  });

  const chain = VectorDBQAChain.fromLLM(model, vectorStore, {
    k: 1,
    returnSourceDocuments: false,
  });

  chain.call({ query: prompt }).catch(console.error);
  return new StreamingTextResponse(stream);
}
