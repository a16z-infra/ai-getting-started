import dotenv from "dotenv";
import { VectorDBQAChain } from "langchain/chains";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { OpenAI } from "langchain/llms/openai";
import { StreamingTextResponse, LangChainStream } from "ai";
import { CallbackManager } from "langchain/callbacks";
import { QdrantVectorStore } from "langchain/vectorstores/qdrant";
import { QdrantClient } from '@qdrant/js-client-rest';

dotenv.config({ path: `.env.local` });

export async function POST(request: Request) {
  const { prompt } = await request.json();
  const qdrantClient = new QdrantClient({ url: process.env.QDRANT_URL, apiKey: process.env?.QDRANT_API_KEY });

  const vectorStore = await QdrantVectorStore.fromExistingCollection(new OpenAIEmbeddings({ openAIApiKey: process.env.OPENAI_API_KEY }), {
    client: qdrantClient,
    collectionName: process.env.QDRANT_COLLECTION_NAME,
  });

  const { stream, handlers } = LangChainStream();
  const model = new OpenAI({
    streaming: true,
    modelName: "gpt-3.5-turbo-16k",
    openAIApiKey: process.env.OPENAI_API_KEY,
    callbackManager: CallbackManager.fromHandlers(handlers),
  });

  const chain = VectorDBQAChain.fromLLM(model, vectorStore, {
    k: 1,
    returnSourceDocuments: true,
  });
  chain.call({ query: prompt }).catch(console.error);

  return new StreamingTextResponse(stream);
}
