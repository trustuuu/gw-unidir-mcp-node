import axios from "axios";

export async function callUnidirTool(toolName, args = {}) {
  const MCP_HTTP_URL = process.env.MCP_HTTP_URL;
  const response = await axios.post(`${MCP_HTTP_URL}/call_tool`, {
    name: toolName,
    arguments: args,
  });
  return response.data?.result?.text || JSON.stringify(response.data);
}
