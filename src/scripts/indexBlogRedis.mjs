// Major ref: https://js.langchain.com/docs/modules/data_connection/vectorstores/integrations/redis
import dotenv from "dotenv";
import { createClient } from "redis";
import { Document } from "langchain/document";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { RedisVectorStore } from "langchain/vectorstores/redis";
import fs from "fs";
import path from "path";

dotenv.config({ path: `.env.local` });

const fileNames = fs.readdirSync("blogs");
const lanchainDocs = fileNames.map((fileName) => {
  const filePath = path.join("blogs", fileName);
  const fileContent = fs.readFileSync(filePath, "utf8");
  return new Document({
    metadata: { fileName },
    pageContent: fileContent,
  });
});

const client = createClient({
  url: process.env.REDIS_URL ?? "redis://localhost:6379",
});
await client.connect();

await RedisVectorStore.fromDocuments(
  lanchainDocs,
  new OpenAIEmbeddings({ openAIApiKey: "random-string", basePath: "http://localhost:8444"}),
  {
    redisClient: client,
    indexName: "docs",
  }
);
await client.disconnect();