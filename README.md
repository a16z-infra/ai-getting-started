# Local AI Stack

This project was built on [AI Starter Kit](https://github.com/a16z-infra/ai-getting-started). The idea is to make it possible for anyone to run a simple AI app 100% locally without having to use their credit card.

## Stack

- Inference: [Ollama](https://github.com/jmorganca/ollama)
- VectorDB: [Supabase pgvector](https://supabase.com/docs/guides/database/extensions/pgvector)
- LLM Orchestration: [Langchain.js](https://js.langchain.com/docs/)
- App logic: [Next.js](https://nextjs.org/)

## Quickstart

### 1. Fork and Clone repo

Fork the repo to your Github account, then run the following command to clone the repo:

```
git clone git@github.com:[YOUR_GITHUB_ACCOUNT_NAME]/local-ai-stack.git
```

### 2. Install dependencies

```
cd local-ai-stack
npm install
```

### 3. Install Ollama

Instructions are [here](https://github.com/jmorganca/ollama#macos)

### 4. Run Supabase locally

1. Install Supabase CLI

```
brew install supabase/tap/supabase
```

2. Start Supabase
   Under the local-ai-stack dir, run

```
supabase start
```

3. Serve embedding generation function

```
supabase functions serve
```

### 5. Fill in secrets

```
cp .env.local.example .env.local
```

The only thing you need to fill out is `SUPABASE_PRIVATE_KEY` -- you can find this by running `supabase status` and copy `anon key`

### 6. Generate embeddings

```bash
node src/scripts/indexBlogPGVectorWithEmbed.mjs
```

### 7. Run app locally

Now you are ready to test out the app locally! To do this, simply run `npm run dev` under the project root.

### 6. Deploy the app

If you want to the the local-only app to the next level, feel free to follow instructions on [AI Starter Kit](https://github.com/a16z-infra/ai-getting-started) for using Clerk, Pinecone/Supabase, OpenAI, Replicate and other cloud-based vendors.

## Refs

- https://github.com/a16z-infra/ai-getting-started
- https://js.langchain.com/docs/modules/indexes/vector_stores/integrations/pinecone
- https://js.langchain.com/docs/modules/models/llms/integrations#replicate
- https://js.langchain.com/docs/modules/chains/index_related_chains/retrieval_qa
