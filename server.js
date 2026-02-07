import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { tools } from "./tools/index.js";
import { runAgent } from "./agents/unidirAgentGemini.js";
import { authenticate } from "./utils/jwks.js";
import { authenticateDownstream } from "./utils/verifyDownstream.js";
import {
  ensureGoogleToken,
  getGoogleAccount,
  getGoogleCalendarEvents,
} from "./services/googleService.js";

dotenv.config();
const app = express();

const PORT = process.env.PORT || 80;
const origins = process.env.ALLOWED_ORIGINS.split(",");
const allowedOrigins = origins;
app.use(
  cors({
    //origin: "http://localhost:3000",
    origin: (origin, callback) => {
      console.log("allowedOrigins, origin", allowedOrigins, origin);
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS blocked"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "x-device-id",
    ],
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
  console.log("req.body", req.body);
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

/**
 * PROTECTED ENDPOINT
 * This requires a DOWNSTREAM TOKEN (second token)
 * NOT login token
 * NOT Google token
 */
app.get("/events", authenticateDownstream, async (req, res) => {
  try {
    const userId = req.auth.sub;
    const companyId = req.auth.companyId || req.auth.tenant_id;
    const domainId = req.auth.domainId;

    // Load ExternalIdentityAccount for Google
    const account = await getGoogleAccount(userId, companyId, domainId);

    // Find Google Connection (client_id & client_secret)
    let connection = {};
    // const connection = await connectionService.getGoogleConnection({
    //   companyId,
    //   domainId,
    // });

    // Ensure valid (or refreshed) Google access token
    const googleAccessToken = await ensureGoogleToken(account, connection);

    // Call REAL Google Calendar API
    const events = await getGoogleCalendarEvents(googleAccessToken);

    return res.json({
      provider: "google",
      userId,
      events,
    });
  } catch (err) {
    console.error("Error in /events:", err);
    return res.status(500).json({
      error: "server_error",
      message: err.message,
    });
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
