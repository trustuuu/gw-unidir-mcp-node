import express from "express";
import dotenv from "dotenv";
import { tools } from "./tools/index.js";

dotenv.config();
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 80;

// ---------- Root: List available tools ----------
app.get("/", (req, res) => {
  res.json({
    message: "Unidir MCP Node.js Server.",
    tools: Object.keys(tools),
  });
});

// ---------- Call a specific tool ----------
app.post("/call_tool", async (req, res) => {
  const { name, arguments: args = {} } = req.body;
  const toolFn = tools[name];
  if (!toolFn) return res.json({ ok: false, error: `Unknown tool: ${name}` });

  try {
    const result = await toolFn(args);
    res.json(result);
  } catch (err) {
    res.json({
      ok: false,
      result: { type: "text", text: `Error: ${err.message}` },
    });
  }
});

// ---------- Start ----------
app.listen(PORT, () => {
  console.log(`[HTTP] MCP Server running on http://localhost:${PORT}`);
});

/*
curl http://localhost:8080/

curl -X POST http://localhost:8080/call_tool \
  -H "Content-Type: application/json" \
  -d '{"name": "get_access_token"}'
*/
