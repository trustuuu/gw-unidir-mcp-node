import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import { callUnidirTool } from "../tools/callUnidirTool.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { baseUrl } from "../utils/constants.js";

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

// ----------------------------------------------------------------------
// Build readable API and UI context for the model
// ----------------------------------------------------------------------
const apiSpecPath = path.resolve(
  __dirname,
  "../ingest/api-docs/unidir_openapi.json"
);
console.log("[DEBUG] Loading backend api spec from", apiSpecPath);
const apiSpec = JSON.parse(fs.readFileSync(apiSpecPath, "utf-8"));
const apiEndpoints = Object.entries(apiSpec.paths)
  .map(([path, ops]) => {
    const methods = Object.keys(ops)
      .map((m) => m.toUpperCase())
      .join(", ");
    return `• ${path} [${methods}]`;
  })
  .join("\n");
//-----------------------------------------------------------------------
const specPath = path.resolve(__dirname, "../ingest/api-docs/unidir_page.json");
console.log("[DEBUG] Loading spec from", specPath);

const uiRules = JSON.parse(fs.readFileSync(specPath, "utf-8"));

// Map over rules and format output
const retrieveRules = uiRules.rules
  .map(
    (r) =>
      `• ${r.rule || r.description}\n  Path: ${r.path}\n  Params: ${
        r.params
      }\n  Desc: ${r.description}`
  )
  .join("\n");

//console.log("retrieveRules", retrieveRules);
//-----------------------------------------------------------------------
// Available backend endpoints (from OpenAPI):
// ${apiEndpoints}

// ----------------------------------------------------------------------
// 4️⃣ Build reasoning prompt dynamically
// ----------------------------------------------------------------------
// function buildReasoningPrompt(userPrompt) {
//   return `
// You are the reasoning layer of the **UniDir Agent**, responsible for deciding:
// - which **MCP tool** to call for backend data retrieval, and/or
// - which **frontend path** to navigate for UI display.

// You must analyze the user's message and output a single **valid JSON object** following the schema below.

// ---

// ### 📘 JSON Output Schema

// {
//   "action": "<MCP tool name, or omit if not needed>",
//   "args": { "<parameter>": "<value>" },
//   "retrievePath": "<frontend route path or omit if not needed>",
//   "retrieveParams": { "<query or path parameters>" },
//   "description": "<short explanation of what this action does>"
// }

// If the user request involves **both** data retrieval and navigation, include both 'action' and 'retrievePath'.

// ---

// ### ⚙️ Available MCP Tools

// 1. **get_access_token(client_id, client_secret)**
// 2. **fetch_unidir_user(company_id, domain_id, user_id, token)**
// 3. **fetch_unidir_group(company_id, domain_id, group_id, token)**
// 4. **fetch_unidir_company(company_id, token)**
// 5. **fetch_unidir_domain(company_id, domain_id, token)**
// 6. **fetch_unidir_application(company_id, domain_id, application_id, token)**

// ---

// ### 🧭 Available Frontend Paths
// ${retrieveRules}

// ---

// ### 🧠 Reasoning Rules

// - When the user mentions **a specific user**, output:
//   {
//     "action": "fetch_unidir_user",
//     "args": { "user_id": "<user id or email>" },
//     "retrievePath": "/onboarding-users/<user id>",
//     "description": "Show the user's details."
//   }

// - When the user mentions **all users**, output:
//   {
//     "action": "fetch_unidir_user",
//     "args": { "user_id": "" },
//     "retrievePath": "/onboarding-users",
//     "description": "List all users."
//   }

// - When the user mentions **a group**, output:
//   {
//     "action": "fetch_unidir_group",
//     "args": { "group_id": "<group id>" },
//     "retrievePath": "/onboarding-groups/<group id>",
//     "description": "Show group details."
//   }

// - When the user mentions **all groups**, output:
//   {
//     "action": "fetch_unidir_group",
//     "args": { "group_id": "" },
//     "retrievePath": "/onboarding-groups",
//     "description": "List all groups."
//   }

// - When the user mentions **a company**, output:
//   {
//     "action": "fetch_unidir_company",
//     "args": { "company_id": "<company id>" },
//     "retrievePath": "/onboarding-companies/<company id>",
//     "description": "Show company details."
//   }

// - When the user mentions **all companies**, output:
//   {
//     "action": "fetch_unidir_company",
//     "args": { "company_id": "" },
//     "retrievePath": "/onboarding-companies",
//     "description": "List all companies."
//   }

// - When the user mentions **a domain**, output:
//   {
//     "action": "fetch_unidir_domain",
//     "args": { "domain_id": "<domain id>" },
//     "retrievePath": "/onboarding-domains/<domain id>",
//     "description": "Show domain details."
//   }

// - When the user mentions **all domains**, output:
//   {
//     "action": "fetch_unidir_domain",
//     "args": { "domain_id": "" },
//     "retrievePath": "/onboarding-domains",
//     "description": "List all domains."
//   }

// - When the user mentions **UI navigation only**, output only:
//   {
//     "retrievePath": "<path>",
//     "retrieveParams": { ... },
//     "description": "<navigation purpose>"
//   }

// - Always include 'retrieveParams' if the frontend route requires dynamic parameters (e.g., { "user_id": "123" }).

// ---

// ### 💬 User Message
// ${userPrompt}

// Return **only the JSON object**, with no extra text or explanation.
// `;
// }

function buildReasoningPrompt(userPrompt) {
  // Step 1: Ask Gemini to reason and decide what to do
  const reasoningPrompt = `
You are an AI agent that can both:
(1) Call UniDir MCP tools via HTTP
(2) Provide frontend navigation paths from the UI navigation JSON ("retrievePath" actions).

Available MCP tools:
1. get_access_token(client_id, client_secret)
2. fetch_unidir_user(company_id, domain_id, user_id, token)
3. fetch_unidir_group(company_id, domain_id, group_id, token)
4. fetch_unidir_company(company_id, token)
5. fetch_unidir_domain(company_id, domain_id, token)
6. fetch_unidir_application(company_id, domain_id, application_id, token)

Available frontend paths:
${retrieveRules}

Rules:
- If the user asks about a user, respond with a JSON object:
  {"action":"fetch_unidir_user","args":{"user_id":"..."},
    "retrievePath": "<path>",
    "retrieveParams": "<params>",
    "description": "<rule description>"}
- If the user asks about all users, respond with a JSON object:
  {"action":"fetch_unidir_user","args":{"user_id":""},
    "retrievePath": "<path>",
    "retrieveParams": "<params>",
    "description": "<rule description>"}

- If the user asks about a group, respond with a JSON object:
  {"action":"fetch_unidir_group","args":{"group_id":"..."},
    "retrievePath": "<path>",
    "retrieveParams": "<params>",
    "description": "<rule description>"}
- If the user asks about all group, respond with a JSON object:
  {"action":"fetch_unidir_group","args":{"group_id":""},
    "retrievePath": "<path>",
    "retrieveParams": "<params>",
    "description": "<rule description>"}

- If the user asks about a application, respond with a JSON object:
  {"action":"fetch_unidir_application","args":{"application_id":"..."},
    "retrievePath": "<path>",
    "retrieveParams": "<params>",
    "description": "<rule description>"}
- If the user asks about all application, respond with a JSON object:
  {"action":"fetch_unidir_application","args":{"application_id":""},
    "retrievePath": "<path>",
    "retrieveParams": "<params>",
    "description": "<rule description>"}

- If the user asks about a company, respond with a JSON object:
  {"action":"fetch_unidir_company","args":{"company_id":"..."},
    "retrievePath": "<path>",
    "retrieveParams": "<params>",
    "description": "<rule description>"}
- If the user asks about all company, respond with a JSON object:
  {"action":"fetch_unidir_company","args":{"company_id":""},
    "retrievePath": "<path>",
    "retrieveParams": "<params>",
    "description": "<rule description>"}

- If the user asks about a domain, respond with a JSON object:
  {"action":"fetch_unidir_domain","args":{"domain_id":"..."},
    "retrievePath": "<path>",
    "retrieveParams": "<params>",
    "description": "<rule description>"}
- If the user asks about all domains, respond with a JSON object:
  {"action":"fetch_unidir_domain","args":{"domain_id":""},
    "retrievePath": "<path>",
    "retrieveParams": "<params>",
    "description": "<rule description>"}

- If the user asks about UI navigation, respond with:
  {"retrievePath":"<path>",
   "retrieveParams": "<params>",
 "description":"<rule description>"}
- If both apply (data fetch and navigation), include both:
  {
    "action": "...",
    "args": {...},
    "retrievePath": "<path>",
    "retrieveParams": "<params>",
    "description": "<rule description>"
  }
- Otherwise, just respond normally.
User message: ${userPrompt}
`;

  return reasoningPrompt;
}

/**
 * Simple Gemini-powered reasoning Agent with MCP integration.
 */
export async function runAgent(auth, token, prompt) {
  const { tenant_id, client_id, companyId, domainId } = auth;
  //console.log("Agent received:", auth, token, prompt);

  let decisionText = "";
  try {
    const reasoningPrompt = buildReasoningPrompt(prompt);
    //console.log("reasoningPrompt:", reasoningPrompt);
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
    action = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
  } catch (err) {
    console.error("Failed to parse decisionText JSON:", err);
    return err.message;
  }

  // Helper: Add visible context if path exists
  const makeSummaryPrompt = (basePrompt, result, action) => {
    let text = `${basePrompt}\n\nResult:\n${result}`;
    if (action?.path) {
      text += `\n\n`;
    }
    if (action?.description) {
      text += `\nDescription: ${action.description}`;
    }
    return text;
  };

  console.log("action", action);
  let finalResult = "";
  if (action?.action === "fetch_unidir_user") {
    const userId = action.args?.user_id;

    const result = await callUnidirTool("fetch_unidir_user", {
      company_id: companyId,
      domain_id: domainId,
      user_id: userId,
      token: token,
    });
    const summaryPrompt = makeSummaryPrompt(prompt, result, action);
    const summary = await model.generateContent(summaryPrompt);
    finalResult = summary.response.text();
    finalResult = AddTargetURL(finalResult, action);
    return finalResult;
  } else if (action?.action === "fetch_unidir_group") {
    const groupId = action.args?.group_id;

    const result = await callUnidirTool("fetch_unidir_group", {
      company_id: companyId,
      domain_id: domainId,
      group_id: groupId,
      token: token,
    });

    // Step 4: Ask Gemini to summarize response
    //const summaryPrompt = `Summarize this UniDir user data clearly. if the result is JSON, display JSON format at the end of result:\n${result}`;
    const summaryPrompt = `${prompt}. result:\n${result}`;
    const summary = await model.generateContent(summaryPrompt);

    finalResult = summary.response.text();
    finalResult = AddTargetURL(finalResult, action);
    return finalResult;

    // console.log("prompt, result, action", prompt, result, action);
    // const summaryPrompt = makeSummaryPrompt(prompt, result, action);
    // console.log("summaryPrompt", summaryPrompt);
    // const summary = await model.generateContent(summaryPrompt);
    // return summary.response.text();
  } else {
    //const finalResult = `[url]:\n\n${uiRules.server.baseUrl}/${uiRules.server.redirect_page}?targetPage=${action.retrievePath}&${action.retrieveParams}\n\n${action.description}`;
    finalResult = AddTargetURL(finalResult, action);
    return finalResult;
  }

  // Step 5: Otherwise just respond directly
  //return finalResult;
}

function jsonToParams(params = {}) {
  if (!params || typeof params !== "object") return "";

  const query = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
    )
    .join("&");

  return query ? `&${query}` : "";
}

function AddTargetURL(finalResult, action) {
  const paramString = jsonToParams(action.retrieveParams);
  console.log("paramString", paramString);
  if (action?.retrievePath) {
    finalResult = `${finalResult}\n\n\n\n\n\n[url]:\n\n${baseUrl}/${uiRules.server.redirect_page}?targetPage=${action.retrievePath}${paramString}\n\n${action.description}`;
  } else {
    finalResult = `[url]:\n\n${baseUrl}/${uiRules.server.redirect_page}?targetPage=${action.retrievePath}${paramString}\n\n${action.description}`;
  }
  return finalResult;
}
