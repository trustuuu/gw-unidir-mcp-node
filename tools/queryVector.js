import { connect } from "@lancedb/lancedb";
import { GoogleGenerativeAI } from "@google/generative-ai";
import path from "path";

import dotenv from "dotenv";
dotenv.config({ path: path.resolve("../.env") });

export async function queryVector(auth, prompt) {
  const { tenant_id, client_id, companyId, domainId } = auth;
  const db = await connect("../ingest/unidir_vectors");
  const table = await db.openTable("api_docs");

  const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = gemini.getGenerativeModel({
    model: process.env.GEMINI_EMBEDED_MODEL,
  });

  const queryEmbedding = await model.embedContent(prompt);
  const results = await table
    .search(queryEmbedding.embedding.values)
    .limit(3)
    .execute();

  console.log("🔍 Top matches:");
  console.log(JSON.stringify(results, null, 2));
}

await queryVector("", "let me know full link to create new user");
