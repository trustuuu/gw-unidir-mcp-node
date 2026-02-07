import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { glob } from "glob";
import { connect } from "@lancedb/lancedb";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config({ path: path.resolve("../.env") });

// --- Configuration ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Configuration ---
const DATA_DIR = path.resolve(__dirname, "api-docs"); // Absolute path to data
const DB_DIR = path.resolve(__dirname, "./unidir_vectors"); // Absolute path to root DB
const COLLECTION_NAME = "api_docs";

const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// 모델명 형식을 'models/text-embedding-004'로 강제하거나 .env 확인
const model = gemini.getGenerativeModel({
  model: process.env.GEMINI_EMBEDED_MODEL || "models/text-embedding-004",
});

// --- Helper: Load JSON files ---
function loadJsonFiles() {
  const files = glob.sync(`${DATA_DIR}/**/unidir_page.json`);
  console.log(`[FILES] Found ${files.length} JSON files`);
  return files;
}

// --- Helper: Flatten JSON (OAuth2 스코프 및 설명 강조 최적화) ---
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

  const files = loadJsonFiles();
  if (files.length === 0) {
    console.warn("⚠️ No files found to ingest.");
    return;
  }

  let table;
  let isFirstRecord = true;

  for (const [index, filePath] of files.entries()) {
    try {
      const raw = fs.readFileSync(filePath, "utf-8");
      const jsonData = JSON.parse(raw);
      const text = flattenJson(jsonData);

      // 🧠 Generate embedding vector
      const embeddingResponse = await model.embedContent(text);
      const vector = embeddingResponse.embedding.values;

      const record = {
        id: index + 1,
        filename: path.basename(filePath),
        path: filePath,
        text: text,
        embedding: vector, // LanceDB는 'vector' 혹은 'embedding' 컬럼명을 자동으로 감지합니다.
      };

      if (isFirstRecord) {
        // 첫 번째 레코드로 테이블 생성 (Overwrite 모드)
        table = await db.createTable(COLLECTION_NAME, [record], {
          mode: "overwrite",
        });
        isFirstRecord = false;
        console.log(
          `[DB] Table '${COLLECTION_NAME}' created with first record.`,
        );
      } else {
        // 이후 레코드는 기존 테이블에 추가
        await table.add([record]);
      }

      console.log(
        `✅ Ingested ${path.basename(filePath)} (${vector.length} dims)`,
      );
    } catch (err) {
      // 503 Overloaded 또는 404 Model Not Found 에러 핸들링
      console.error(`[Error] Failed to ingest ${filePath}:`, err.message);
      if (err.message.includes("503")) {
        console.log(
          "💡 Tip: 모델 과부하입니다. 잠시 후 다시 시도하거나 gemini-2.5-flash를 고려하세요.",
        );
      }
    }
  }

  console.log(
    `\n[DONE] All JSON files ingested into LanceDB (${COLLECTION_NAME})`,
  );
}

// 실행
ingestJsonFiles().catch(console.error);
