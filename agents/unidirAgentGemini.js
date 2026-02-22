import { VertexAI } from "@google-cloud/vertexai";
import { GoogleAuth } from "google-auth-library";
import dotenv from "dotenv";
import { callUnidirTool } from "../tools/callUnidirTool.js";
import { tools } from "../tools/index.js";
import path from "path";
//import { fileURLToPath } from "url";
import { baseUrlWebApp } from "../utils/constants.js";
import { buildReasoningPrompt } from "../utils/propmts.js";
import { connect } from "@lancedb/lancedb";

dotenv.config();

// ----------------------------------------------------------------------
// 3️⃣ Initialize Gemini client
// ----------------------------------------------------------------------
const base64Key = process.env.GCP_SERVICE_ACCOUNT_KEY?.trim();
const jsonString = Buffer.from(base64Key, "base64").toString("utf-8");
const serviceAccount = JSON.parse(jsonString);
const privateKey = serviceAccount.private_key.replace(/\\n/g, "\n");
const auth = new GoogleAuth({
  credentials: {
    client_email: serviceAccount.client_email,
    private_key: privateKey,
  },
  scopes: "https://www.googleapis.com/auth/cloud-platform",
});
const client = await auth.getClient();

const vertex_ai = new VertexAI({
  project: process.env.GEMINI_MODEL_PROJECT,
  location: process.env.GEMINI_MODEL_LOCATION,
  googleAuthOptions: {
    credentials: {
      client_email: serviceAccount.client_email,
      private_key: privateKey,
    },
  },
});

const model = vertex_ai.getGenerativeModel({
  model: process.env.GEMINI_MODEL,
});

//const __filename = fileURLToPath(import.meta.url);
//const __dirname = path.dirname(__filename);

// --- Manual Embedding Helper ---
async function getEmbedding(text) {
  const project = process.env.GEMINI_MODEL_PROJECT;
  const location = process.env.GEMINI_MODEL_LOCATION;
  const modelId = process.env.GEMINI_EMBEDED_MODEL || "text-embedding-004";
  const apiEndpoint = `https://${location}-aiplatform.googleapis.com`;
  const url = `${apiEndpoint}/v1/projects/${project}/locations/${location}/publishers/google/models/${modelId}:predict`;

  // const auth = new GoogleAuth({
  //   scopes: "https://www.googleapis.com/auth/cloud-platform",
  // });
  // const client = await auth.getClient();
  // const accessToken = await client.getAccessToken();
  //const serviceAccount = JSON.parse(process.env.GCP_SERVICE_ACCOUNT_KEY);

  // Fetch a fresh access token per execution to prevent expiry crashes
  const accessToken = await client.getAccessToken();

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      instances: [{ content: text }],
      parameters: {},
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Embedding API failed: ${response.status} ${response.statusText} - ${await response.text()}`,
    );
  }

  const data = await response.json();
  return data.predictions[0].embeddings.values;
}

export async function runAgent(
  auth,
  token,
  prompt,
  history = [],
  contextData = null,
) {
  const { tenant_id, client_id, companyId, domainId } = auth;

  let decisionText = "";
  try {
    const DB_PATH = path.join(process.cwd(), "ingest/unidir_vectors");
    const db = await connect(DB_PATH);
    const table = await db.openTable("api_docs");
    // 1. Embed the user prompt to find what they are looking for
    const queryVector = await getEmbedding(prompt);

    // 2. Search Vector DB for top 3 relevant docs
    const results = await table.search(queryVector).limit(3).toArray();

    // 3. Format context string
    const retrievedContext = results
      .map((r) => `Path: ${r.path}\nContent: ${r.text}`)
      .join("\n---\n");
    const reasoningPrompt = buildReasoningPrompt(
      prompt,
      retrievedContext,
      contextData,
    );
    console.log("reasoningPrompt", reasoningPrompt);

    // Construct multi-turn conversation
    const contents = [
      ...history,
      { role: "user", parts: [{ text: reasoningPrompt }] },
    ];

    const reasoningResult = await model.generateContent({ contents });
    console.log("reasoningResult:", reasoningResult);
    const resoningResponse = await reasoningResult.response;
    console.log("resoningResponse:", resoningResponse);

    if (resoningResponse.candidates && resoningResponse.candidates.length > 0) {
      const candidate = resoningResponse.candidates[0];
      if (candidate.content && candidate.content.parts.length > 0) {
        decisionText = candidate.content.parts[0].text;
        console.log("Agent Response:", decisionText);
      } else {
        throw new Error("Failed to Gemini decision: No content parts");
      }
    } else {
      throw new Error("Failed to Gemini decision: No candidates");
    }
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
    if (action?.action === "use_context" && contextData) {
      console.log("Using provided contextData for follow-up query");
      const resultTool =
        typeof contextData === "string"
          ? contextData
          : JSON.stringify(contextData);
      finalResult = await getFinalResult(action, prompt, resultTool, history);
      return { reply: finalResult, rawData: contextData };
    }

    // If no tool call, the decisionText itself is the response
    finalResult = decisionText;
    finalResult = AddTargetURL(finalResult, action);
    return { reply: finalResult, rawData: contextData };
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
    } else if (
      action?.action.startsWith("create_unidir_") ||
      action?.action.startsWith("update_unidir_") ||
      action?.action.startsWith("delete_unidir_")
    ) {
      const entityStr = action?.action.split("_").pop();
      const idKey = `${entityStr}_id`;
      const objectId = action.args?.[idKey] || null;

      ToolData = {
        company_id: action.args?.company_id || companyId,
        domain_id: action.args?.domain_id || domainId,
        object_id: objectId,
        token: token,
        body_json: action.args?.body_json || "{}",
      };
    }
    console.log("ToolData", ToolData);
    const resultTool = await callUnidirTool(action?.action, ToolData);
    console.log("action, resultTool", action, resultTool);
    finalResult = await getFinalResult(action, prompt, resultTool, history);
    console.log(`${action?.action} finalResult`, finalResult);

    let newRawData = null;
    try {
      newRawData =
        typeof resultTool === "string" ? JSON.parse(resultTool) : resultTool;
    } catch {
      newRawData = resultTool;
    }

    return { reply: finalResult, rawData: newRawData };
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

async function getFinalResult(action, prompt, result, history = []) {
  // Step 4: Ask Gemini to summarize response
  //const summaryPrompt = `Summarize this UniDir user data clearly. if the result is JSON, display JSON format at the end of result:\n${result}`;
  const summaryPrompt = `${prompt}. if the result is JSON, return with markdown table format. result:\n${result}`;

  const contents = [
    ...history,
    { role: "user", parts: [{ text: summaryPrompt }] },
  ];

  const summaryResult = await model.generateContent({ contents });
  console.log("summaryResult:", summaryResult);
  const summaryResponse = await summaryResult.response;
  console.log("summaryResponse:", summaryResponse);
  let finalResult = "";
  if (summaryResponse.candidates && summaryResponse.candidates.length > 0) {
    const candidate = summaryResponse.candidates[0];
    if (candidate.content && candidate.content.parts.length > 0) {
      finalResult = candidate.content.parts[0].text;
      finalResult = AddTargetURL(finalResult, action);
      console.log("Agent Response:", finalResult);
    } else {
      finalResult = "Failed to summary decision: No content parts";
    }
  } else {
    finalResult = "Failed to summary decision: No candidates";
  }

  return finalResult;
}
