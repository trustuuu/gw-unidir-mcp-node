import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { tools } from "./tools/index.js";
import { runAgent } from "./agents/unidirAgentGemini.js";
import { authenticate } from "./utils/jwks.js";

dotenv.config();
const app = express();

const PORT = process.env.PORT || 80;
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
// app.use((req, res, next) => {
//   const origin = req.headers.origin;
//   console.log("origin", origin, req.path.replace(/\/$/, ""));
//   res.header("Access-Control-Allow-Origin", "http://localhost:3000");
//   res.header(
//     "Access-Control-Allow-Headers",
//     "Origin, X-Requested-With, Content-Type, Accept, Authorization"
//   );
//   res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
//   if (req.method === "OPTIONS") {
//     return res.sendStatus(200);
//   }
//   next();
// });
app.use(express.json());
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

app.post("/chat", authenticate, async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader.split(" ")[1];
    const { message } = req.body;
    const reply = await runAgent(req.auth, token, message);
    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ---------- Start ----------
app.listen(PORT, () => {
  console.log(`[HTTP] MCP Server running on http://localhost:${PORT}`);
});

/*
curl http://localhost:8080/

curl -X POST https://gw-unidir-mcp-node.vercel.app/call_tool \
  -H "Content-Type: application/json" \
  -d '{"name": "get_access_token",
       "client_id": "adfadsvVETVVdfdftVDDSDVDkdfdfndf",
       "client_secret":"9SmSkvoLuGeFfA7IHsjb31cOPl1CPwgn"}'
  
*/
