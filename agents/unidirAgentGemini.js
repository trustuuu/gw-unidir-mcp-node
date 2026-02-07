import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import { callUnidirTool } from "../tools/callUnidirTool.js";
import { tools } from "../tools/index.js";
import path from "path";
import { fileURLToPath } from "url";
import { baseUrlWebApp } from "../utils/constants.js";
import { buildReasoningPrompt } from "../utils/propmts.js";
import { connect } from "@lancedb/lancedb";

dotenv.config();

// ----------------------------------------------------------------------
// 3️⃣ Initialize Gemini client
// ----------------------------------------------------------------------
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: process.env.GEMINI_MODEL, //"gemini-2.0-flash",
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
console.log("__filename, __dirname", __filename, __dirname);

export async function runAgent(auth, token, prompt) {
  const { tenant_id, client_id, companyId, domainId } = auth;
  console.log("Agent received:", auth, token, prompt);

  let decisionText = "";
  try {
    const DB_PATH = path.join(process.cwd(), "ingest/unidir_vectors");
    const db = await connect(DB_PATH);
    const table = await db.openTable("api_docs");
    // 1. Embed the user prompt to find what they are looking for
    const embeddingModel = genAI.getGenerativeModel({
      model: process.env.GEMINI_EMBEDED_MODEL || "text-embedding-004",
    });
    const embeddingResult = await embeddingModel.embedContent(prompt);
    const queryVector = embeddingResult.embedding.values;
    // 2. Search Vector DB for top 3 relevant docs
    const results = await table.search(queryVector).limit(3).toArray();
    console.log("results", results);
    // 3. Format context string
    const retrievedContext = results
      .map((r) => `Path: ${r.path}\nContent: ${r.text}`)
      .join("\n---\n");
    const reasoningPrompt = buildReasoningPrompt(prompt, retrievedContext);
    const reasoningResult = await model.generateContent(reasoningPrompt);
    decisionText = reasoningResult.response.text();
    console.log("Gemini decision:", decisionText);
  } catch (err) {
    console.error("Failed to Gemini decision::", err);
    return err.message;
  }

  // Step 2: Try to parse JSON action from Gemini
  let action = {};
  try {
    const jsonMatch = decisionText.match(/\{(?:[^{}]|{[^{}]*})*\}/);
    console.log(
      "decisionText, jsonMatch",
      decisionText,
      jsonMatch,
      jsonMatch.length,
    );
    action = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    console.log("action", action);
  } catch (err) {
    console.error("Failed to parse decisionText JSON:", err);
    return err.message;
  }

  const toolAction = tools[action?.action];
  console.log(
    "toolAction, action?.action, tools",
    toolAction,
    action?.action,
    tools,
  );
  let finalResult = "";
  if (!toolAction) {
    finalResult = AddTargetURL(finalResult, action);
    return finalResult;
  } else {
    let ToolData = {};
    if (action?.action === "fetch_unidir_user") {
      const objectId = action.args?.user_id;
      ToolData = {
        company_id: companyId,
        domain_id: domainId,
        user_id: objectId,
        token: token,
      };
    } else if (action?.action === "fetch_unidir_group") {
      const objectId = action.args?.group_id;
      ToolData = {
        company_id: companyId,
        domain_id: domainId,
        group_id: objectId,
        token: token,
      };
    } else if (action?.action === "fetch_unidir_domain") {
      const objectId = action.args?.domain_id;
      ToolData = {
        company_id: companyId,
        domain_id: objectId ? objectId : domainId,
        token: token,
      };
    } else if (action?.action === "fetch_unidir_company") {
      const objectId = action.args?.company_id;
      console.log("objectId", objectId);
      ToolData = {
        company_id: objectId ? objectId : companyId,
        token: token,
        extend_prop:
          action?.retrievePath != "onboarding-company-new"
            ? "childCompanys"
            : "",
        //params: objectId ? `{ "companyId": "${companyId}" }` : "",
      };
    } else if (action?.action === "fetch_unidir_application") {
      const objectId = action.args?.application_id;
      ToolData = {
        company_id: companyId,
        domain_id: domainId,
        application_id: objectId,
        token: token,
      };
    }
    console.log("ToolData", ToolData);
    const resultTool = await callUnidirTool(action?.action, ToolData);
    console.log("action, resultTool", action, resultTool);
    finalResult = await getFinalResult(action, prompt, resultTool);
    console.log(`${action?.action} finalResult`, finalResult);

    return finalResult;
  }
}

function jsonToParams(params) {
  if (!params) return "";
  // let params = null;
  if (typeof params == "string")
    params = JSON.parse(params.replaceAll("'", '"'));
  // else params = Params;
  //if (!params || typeof params !== "object") return "";

  const query = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
    )
    .join("&");

  return query ? `&${query}` : "";
}

function AddTargetURL(result, action) {
  const paramString = jsonToParams(action.retrieveParams);
  const urlParams = jsonToParams(action.urlParams);
  console.log("paramString, urlParams", paramString, urlParams);
  let finalResult = "";
  if (action?.retrievePath) {
    finalResult = `${result}\n\n\n\n\n\n[url]:\n\n${baseUrlWebApp}/${process.env.MCP_REDIRECT_PAGE}?targetPage=${action.retrievePath}${paramString}${urlParams}\n\n${action.description}`;
  } else {
    finalResult = result;
  }
  console.log("action AddTargetURL", action);
  return finalResult;
}

async function getFinalResult(action, prompt, result) {
  // Step 4: Ask Gemini to summarize response
  //const summaryPrompt = `Summarize this UniDir user data clearly. if the result is JSON, display JSON format at the end of result:\n${result}`;
  const summaryPrompt = `${prompt}. result:\n${result}`;
  const summary = await model.generateContent(summaryPrompt);

  const finalResult = AddTargetURL(summary.response.text(), action);

  return finalResult;
}
