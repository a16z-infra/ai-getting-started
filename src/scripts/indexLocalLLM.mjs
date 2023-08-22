// ref: https://js.langchain.com/docs/modules/data_connection/vectorstores/integrations/redis
import { createClient, createCluster } from "redis";
import { Document } from "langchain/document";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { RedisVectorStore } from "langchain/vectorstores/redis";

const client = createClient({
  url: process.env.REDIS_URL ?? "redis://localhost:6379",
});
await client.connect();

const docs = [
  new Document({
    metadata: { foo: "bar" },
    pageContent: "redis is fast",
  }),
  new Document({
    metadata: { foo: "bar" },
    pageContent: "the quick brown fox jumped over the lazy dog",
  }),
  new Document({
    metadata: { baz: "qux" },
    pageContent: "lorem ipsum dolor sit amet",
  }),
  new Document({
    metadata: { baz: "qux" },
    pageContent: "consectetur adipiscing elit",
  }),
];

const vectorStore = await RedisVectorStore.fromDocuments(
  docs,
  new OpenAIEmbeddings({ openAIApiKey: "random-string", basePath: "http://localhost:8444"}),
  {
    redisClient: client,
    indexName: "docs",
  }
);

await client.disconnect();