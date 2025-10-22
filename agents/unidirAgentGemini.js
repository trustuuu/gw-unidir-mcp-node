import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import { callUnidirTool } from "../tools/callUnidirTool.js";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
console.log("process.env.GEMINI_API_KEY", process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
});

/**
 * Simple Gemini-powered reasoning Agent with MCP integration.
 */
export async function runAgent(auth, token, prompt) {
  const { tenant_id, client_id, companyId, domainId } = auth;
  console.log("Agent received:", auth, token, prompt);

  // Step 1: Ask Gemini to reason and decide what to do
  const reasoningPrompt = `
You are an AI agent that can call UniDir MCP tools via HTTP.
Available tools:
1. get_access_token(client_id, client_secret)
2. fetch_unidir_user(company_id, domain_id, user_id, token)
3. fetch_unidir_group(company_id, domain_id, group_id, token)

If the user asks about a user, respond with a JSON object:
{"action":"fetch_unidir_user","args":{"user_id":"..."}}  
If the user asks about all user, respond with a JSON object:
{"action":"fetch_unidir_user","args":{"user_id":""}}  
If the user asks about a group, respond with a JSON object:
{"action":"fetch_unidir_group","args":{"group_id":"..."}}
If the user asks about all group, respond with a JSON object:
{"action":"fetch_unidir_group","args":{"group_id":""}}
Otherwise, just respond normally.
User message: ${prompt}
`;

  const reasoningResult = await model.generateContent(reasoningPrompt);
  const decisionText = reasoningResult.response.text();
  console.log("🤔 Gemini decision:", decisionText);

  // Step 2: Try to parse JSON action from Gemini
  let action;
  try {
    action = JSON.parse(decisionText.match(/{[\s\S]*}/)?.[0] || "{}");
  } catch {
    action = {};
  }

  // Step 3: If Gemini requested a tool call, execute it
  if (action?.action === "fetch_unidir_user") {
    const userId = action.args.user_id;

    const result = await callUnidirTool("fetch_unidir_user", {
      company_id: companyId,
      domain_id: domainId,
      user_id: userId,
      token: token, //process.env.UNIDIR_TOKEN,
    });

    // Step 4: Ask Gemini to summarize response
    //const summaryPrompt = `Summarize this UniDir user data clearly. if the result is JSON, display JSON format at the end of result:\n${result}`;
    const summaryPrompt = `${prompt}. result:\n${result}`;
    const summary = await model.generateContent(summaryPrompt);
    return summary.response.text();
  } else if (action?.action === "fetch_unidir_group") {
    const groupId = action.args.group_id;

    const result = await callUnidirTool("fetch_unidir_group", {
      company_id: companyId,
      domain_id: domainId,
      group_id: groupId,
      token: token, //process.env.UNIDIR_TOKEN,
    });

    // Step 4: Ask Gemini to summarize response
    const summaryPrompt = `Summarize this UniDir user data clearly. if the result is JSON, display JSON format at the end of result:\n${result}`;
    const summary = await model.generateContent(summaryPrompt);
    return summary.response.text();
  }
  // Step 5: Otherwise just respond directly
  return decisionText;
}
