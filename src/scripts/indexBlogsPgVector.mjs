import dotenv from "dotenv";
import { Configuration, OpenAIApi } from "openai";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

dotenv.config({ path: `.env.local` });

const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
const openai = new OpenAIApi(configuration);
const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

const fileNames = fs.readdirSync("blogs");
const docs = fileNames.map((fileName) => {
  const filePath = path.join("blogs", fileName);
  const fileContent = fs.readFileSync(filePath, "utf8");
  return fileContent;
});
console.log(docs.length);

const chunkSize = 4096; // Adjust the chunk size as per your needs

for (const doc of docs) {
  const chunks = doc.match(new RegExp(`.{1,${chunkSize}}`, "g"));
  const embeddings = [];
  for (const chunk of chunks) {
    const input = chunk.replace(/\n/g, " ");
    const embeddingResponse = await openai.createEmbedding({
      model: "text-embedding-ada-002",
      input,
    });
    const [{ embedding }] = embeddingResponse.data.data;
    const supabaseResponse = await supabaseClient.from("documents").insert({
      content: chunk,
      embedding: embedding,
    });
  }
}
