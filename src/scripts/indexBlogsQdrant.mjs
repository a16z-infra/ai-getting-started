// Major ref: https://js.langchain.com/docs/modules/indexes/vector_stores/integrations/qdrant

import dotenv from "dotenv";
import { Document } from "langchain/document";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import {QdrantClient} from '@qdrant/js-client-rest';
import { QdrantVectorStore } from "langchain/vectorstores/qdrant";
import fs from "fs";
import path from "path";

dotenv.config({ path: `.env.local` });

const MAX_TOKENS = 8191;

const fileNames = fs.readdirSync("blogs");

// Helper function to chunk a string into smaller parts
const chunkString = (str, length) => {
  const size = Math.ceil(str.length / length);
  const r = Array(size);
  let offset = 0;

  for (let i = 0; i < size; i++) {
    r[i] = str.substr(offset, length);
    offset += length;
  }

  return r;
};

const lanchainDocs = [];

fileNames.forEach((fileName) => {
  const filePath = path.join("blogs", fileName);
  const fileContent = fs.readFileSync(filePath, "utf8");

  const chunks = chunkString(fileContent, MAX_TOKENS);

  chunks.forEach((chunk, index) => {
    lanchainDocs.push(new Document({
      metadata: { fileName, chunkIndex: index },
      pageContent: chunk,
    }));
  });
});


const qdrantClient = new QdrantClient({ url: process.env.QDRANT_URL, apiKey: process.env?.QDRANT_API_KEY });

await QdrantVectorStore.fromDocuments(
  langchainDocs,
  new OpenAIEmbeddings({ openAIApiKey: process.env.OPENAI_API_KEY }),
  {
    client: qdrantClient,
    collectionName: process.env.QDRANT_COLLECTION_NAME,
  }
);
