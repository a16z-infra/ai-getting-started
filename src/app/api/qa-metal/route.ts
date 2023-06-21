import { Metal } from "@getmetal/metal-sdk";
import dotenv from "dotenv";
import { RetrievalQAChain } from "langchain/chains";
import { MetalRetriever } from "langchain/retrievers/metal";
import { OpenAI } from "langchain/llms/openai";
import { StreamingTextResponse, LangChainStream } from "ai";
import { CallbackManager } from "langchain/callbacks";

dotenv.config({ path: `.env.local` });

export async function POST(request: Request) {
  const { prompt } = await request.json();
  const metal = new Metal(process.env.METAL_API_KEY, process.env.METAL_CLIENT_ID, process.env.METAL_INDEX_ID);

  const retriever = new MetalRetriever({ client: metal });


  const { stream, handlers } = LangChainStream();
  const model = new OpenAI({
    streaming: true,
    modelName: "gpt-3.5-turbo-16k",
    openAIApiKey: process.env.OPENAI_API_KEY,
    callbackManager: CallbackManager.fromHandlers(handlers),
  });

  const chain = RetrievalQAChain.fromLLM(model, retriever, {
    // k: 1,
    returnSourceDocuments: true,
  });

  chain.call({ query: prompt }).catch(console.error);

  return new StreamingTextResponse(stream);
}
