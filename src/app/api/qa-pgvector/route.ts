import { Configuration, OpenAIApi } from "openai";
import dotenv from "dotenv";
import { OpenAI } from "langchain/llms/openai";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import GPT3Tokenizer from "gpt3-tokenizer";

dotenv.config({ path: `.env.local` });

export async function POST(request: Request) {
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(configuration);
  const supabaseClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

  const { prompt } = await request.json();
  const input = prompt.replace(/\n/g, " ");

  // Generate a one-time embedding for the query itself
  const embeddingResponse = await openai.createEmbedding({
    model: "text-embedding-ada-002",
    input,
  });

  const [{ embedding }] = embeddingResponse.data.data;
  console.log(embedding);

  const { data: documents } = await supabaseClient.rpc("match_documents", {
    query_embedding: embedding,
  });

  const tokenizer = new GPT3Tokenizer({ type: "gpt3" });
  let tokenCount = 0;
  let contextText = "";

  // Concat matched documents
  console.log(documents);
  for (let i = 0; i < documents.length; i++) {
    const document = documents[i];
    const content = document.content;
    const encoded = tokenizer.encode(content);
    tokenCount += encoded.text.length;

    // Limit context to max 1500 tokens (configurable)
    if (tokenCount > 1500) {
      break;
    }

    contextText += `${content.trim()}\n---\n`;
  }

  const answerPrompt = `${`
  Given the following sections from blogs, answer the question using only that information,
  outputted in markdown format. If you are unsure and the answer
  is not explicitly written in the documentation, say
  "Sorry, I don't know how to help with that."`}

  Context sections:
  ${contextText}

  Question: """
  ${prompt}
  """

  Answer as markdown (including related code snippets if available):
`;

  const completionResponse = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: answerPrompt,
    max_tokens: 512, // Choose the max allowed tokens in completion
    temperature: 0, // Set to 0 for deterministic results
  });

  const {
    id,
    choices: [{ text }],
  } = completionResponse.data;

  const response = completionResponse.data;
  console.log(response);
  return NextResponse.json(response);
}
