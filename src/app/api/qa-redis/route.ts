import { PineconeClient } from "@pinecone-database/pinecone";
import dotenv from "dotenv";
import { createClient } from "redis";
import { VectorDBQAChain } from "langchain/chains";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { OpenAI } from "langchain/llms/openai";
import { RedisVectorStore } from "langchain/vectorstores/redis";
import { StreamingTextResponse, LangChainStream } from "ai";
import { CallbackManager } from "langchain/callbacks";

dotenv.config({ path: `.env.local` });

export async function POST(request: Request) {
  const { prompt } = await request.json();
  const client = createClient({
    url: process.env.REDIS_BASE_URL ?? "redis://localhost:6379",
  });
  await client.connect();

  const vectorStore = await new RedisVectorStore(
    new OpenAIEmbeddings({ openAIApiKey: "random-string"}, {basePath: process.env.EMBEDDINGS_MODEL_BASE_URL ?? "http://localhost:8444/v1"}),
    {
        redisClient: client,
        indexName: "docs",
      }
  );

  const { stream, handlers } = LangChainStream();
  const model = new OpenAI({
    streaming: true,
    modelName: "gpt-3.5-turbo-16k",
    openAIApiKey: "random-string",
    callbackManager: CallbackManager.fromHandlers(handlers),
  }, {basePath: process.env.CHAT_MODEL_BASE_URL ?? "http://localhost:8230/v1"});

  const chain = VectorDBQAChain.fromLLM(model, vectorStore, {
    k: 1,
    returnSourceDocuments: true,
  });
  chain.call({ query: prompt }).catch(console.error);

  return new StreamingTextResponse(stream);
}
