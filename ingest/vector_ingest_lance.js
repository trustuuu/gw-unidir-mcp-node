// import { connect } from "@lancedb/lancedb";
// import { GoogleGenerativeAI } from "@google/generative-ai";

// const db = await connect("./unidir_vectors"); // folder path
// const table = await db.createTable("api_docs", [], { mode: "overwrite" });

// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// const model = genAI.getGenerativeModel({
//   model: "gemini-2.0-flash",
// });
// // 🧠 Generate embedding vector
// const embeddingResult = await model.embedContent("GET /users endpoint");
// const vector = embeddingResult.embedding.values; // array of floats

// await table.add([{ id: 1, text: "POST /users", embedding: embed.data[0].embedding }]);

// const results = await table.search(embed.data[0].embedding).limit(3).execute();
// console.log(results);

/**
 * Ingest JSON files into LanceDB using Gemini embeddings.
 * Each JSON file is embedded and stored as a searchable vector.
 */

import dotenv from "dotenv";
dotenv.config({ path: path.resolve("../.env") });

import fs from "fs";
import path from "path";
import { glob } from "glob";
import { connect } from "@lancedb/lancedb";
import { GoogleGenerativeAI } from "@google/generative-ai";

// --- Configuration ---
const DATA_DIR = "./api-docs"; // Folder containing .json files
const DB_DIR = "./unidir_vectors"; // LanceDB storage path
const COLLECTION_NAME = "api_docs"; // Table name
const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = gemini.getGenerativeModel({
  model: process.env.GEMINI_EMBEDED_MODEL,
});

// --- Helper: Load JSON files ---
function loadJsonFiles() {
  const files = glob.sync(`./${DATA_DIR}/**/*.json`);
  console.log(`[FILES] Found ${files.length} JSON files`);
  return files;
}

// --- Helper: Flatten JSON object into text ---
function flattenJson(jsonObj, prefix = "") {
  let result = [];
  for (const key in jsonObj) {
    const value = jsonObj[key];
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "object" && value !== null) {
      result = result.concat(flattenJson(value, fullKey));
    } else {
      result.push(`${fullKey}: ${value}`);
    }
  }
  return result.join("\n");
}

// --- Main ingestion ---
export async function ingestJsonFiles() {
  console.log(`[DB] Connecting to LanceDB at ${DB_DIR}`);
  const db = await connect(DB_DIR);

  // Your first document record
  const record = {
    id: 1,
    filename: "test.json",
    path: "./api-docs/test.json",
    text: "POST /test - create a new user",
    embedding: Array(768).fill(0.1),
  };

  const table = await db.createTable(COLLECTION_NAME, [record], {
    mode: "overwrite",
  });

  const files = loadJsonFiles();

  for (const [index, filePath] of files.entries()) {
    try {
      const raw = fs.readFileSync(filePath, "utf-8");
      const jsonData = JSON.parse(raw);

      const text = flattenJson(jsonData);
      const embedding = await model.embedContent(text);

      const vector = embedding.embedding.values;

      await table.add([
        {
          id: index + 1,
          filename: path.basename(filePath),
          path: filePath,
          text,
          embedding: vector,
        },
      ]);

      console.log(
        `✅ Ingested ${path.basename(filePath)} (${vector.length} dims)`
      );
    } catch (err) {
      console.error(`[Error]Failed to ingest ${filePath}:`, err.message);
    }
  }

  console.log(
    `[DONE] All JSON files ingested into LanceDB (${COLLECTION_NAME})`
  );
}

await ingestJsonFiles();
