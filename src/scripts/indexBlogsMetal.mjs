import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { Metal } from "@getmetal/metal-sdk";
import { Document } from "langchain/document";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

dotenv.config({ path: `.env.local` });

const metal = new Metal(process.env.METAL_API_KEY, process.env.METAL_CLIENT_ID);

const fileNames = fs.readdirSync("blogs");
const splitter = RecursiveCharacterTextSplitter.fromLanguage("markdown", {
  chunkSize: 1000,
  chunkOverlap: 50,
});

const langchainDocs = await Promise.all(
  fileNames.map(async (fileName) => {
    const filePath = path.join("blogs", fileName);
    const fileContent = fs.readFileSync(filePath, "utf8");
    const splitDocs = await splitter.splitText(fileContent);
    return splitDocs.map((doc) => {
      return new Document({
        metadata: { fileName },
        pageContent: doc,
      });
    });
  })
);

const docs = langchainDocs.flat().map(doc => ({
  index: process.env.METAL_INDEX_ID,
  text: doc.pageContent,
  metadata: { ...(doc?.metadata || {}) }
}))


try {
  const res = await metal.indexMany(docs)
  console.log('Success: ', res);
} catch (err) {
  const msg = err?.response?.data?.message
  console.log('Error: ', msg || err);
}
