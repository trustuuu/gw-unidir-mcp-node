import fs from "fs";
import path from "path";
import { ChromaClient } from "chromadb";
//import openapi from './openapi.json' with { type: "json" };

// const client = new ChromaClient({ path: "http://localhost:9000" });
// chroma run --host 0.0.0.0 --port 8000

const client = new ChromaClient({ path: "./chromadb" });

/**
 * Recursively load .txt and .json files from a folder
 * and add them to a Chroma collection as documents.
 */
export async function ingestDocumentsFromFolder(
  folderPath,
  collectionName = "api-specs"
) {
  const collection = await client.getOrCreateCollection({
    name: collectionName,
  });

  const files = fs.readdirSync(folderPath);
  const docs = [];
  const ids = [];
  const metadatas = [];

  for (const file of files) {
    const fullPath = path.join(folderPath, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // recursively read nested folders
      await ingestDocumentsFromFolder(fullPath, collectionName);
      continue;
    }

    if (file.endsWith(".txt")) {
      const content = fs.readFileSync(fullPath, "utf-8");
      docs.push(content);
      ids.push(file);
      metadatas.push({ type: "text", path: fullPath });
    }

    if (file.endsWith(".json")) {
      try {
        const jsonData = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
        docs.push(JSON.stringify(jsonData, null, 2));
        ids.push(file);
        metadatas.push({ type: "json", path: fullPath });
      } catch (err) {
        console.error(`[ERROR] Invalid JSON file: ${file}`, err.message);
      }
    }
  }

  if (docs.length > 0) {
    console.log(
      `[VECTOR] Adding ${docs.length} documents to '${collectionName}'...`
    );
    await collection.add({ ids, documents: docs, metadatas });
    console.log(
      `[VECTOR] ✅ Ingested ${docs.length} documents from ${folderPath}`
    );
  } else {
    console.log(`[VECTOR] No .txt or .json files found in ${folderPath}`);
  }
}

// Run from CLI
// if (process.argv[2]) {
//   const folderPath = process.argv[2];
//   ingestDocumentsFromFolder(folderPath).catch(console.error);
// } else {
//   console.log("Usage: node vector_ingest.js <folderPath>");
// }
