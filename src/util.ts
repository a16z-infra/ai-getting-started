import { SupabaseClient } from "@supabase/supabase-js";

const embedding_endpoint = process.env.SUPABASE_EMBEDDING_ENDPOINT!;

export async function vectorSearch(
  client: SupabaseClient,
  contentToSearch: string
) {
  const embedding = await generateEmbedding(contentToSearch);
  const result = await client.rpc("match_documents", {
    query_embedding: embedding,
    match_count: 3,
  });

  if (result.error) {
    console.error("ERROR: ", result.error);
  }
  return result.data || "";
}

export async function generateEmbedding(content: string) {
  const headers = new Headers();
  headers.append("Authorization", "Bearer " + process.env.SUPABASE_PRIVATE_KEY);
  headers.append("Content-Type", "application/json");
  const body = JSON.stringify({
    input: content,
  });
  const response = await fetch(embedding_endpoint, {
    method: "POST",
    headers,
    body,
  });
  const json = await response.json();
  return json.embedding;
}
