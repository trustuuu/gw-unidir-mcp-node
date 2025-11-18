export function buildReasoningPrompt(userPrompt, retrieveRules) {
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
- If the user asks to get a user with userId, respond with a JSON object. retrieveParams userId should be replaced with actual value of user_id.:
  {"action":"fetch_unidir_user","args":{"user_id":"..."},
    "retrievePath": "<path>",
    "retrieveParams": "<params>",
    "description": "<rule description>"}

- If the user asks about a group, respond with a JSON object:
  {"action":"fetch_unidir_group","args":{"group_id":"..."},
    "retrievePath": "<path>",
    "retrieveParams": "<params>",
    "description": "<rule description>"}
- If the user asks about all groups, respond with a JSON object:
  {"action":"fetch_unidir_group","args":{"group_id":""},
    "retrievePath": "<path>",
    "retrieveParams": "<params>",
    "description": "<rule description>"}
- If the user asks to get a group with groupId, respond with a JSON object. retrieveParams groupId should be replaced with actual value of group_id.:
  {"action":"fetch_unidir_user","args":{"group_id":"..."},
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

- If the user asks to get a company with companyId, respond with a JSON object.  retrieveParams companyId should be replaced with actual value of company_id.:
  {"action":"fetch_unidir_company","args":{"company_id":"..."},
    "retrievePath": "<path>",
    "retrieveParams": "<params>",
    "description": "<rule description>"}

- If the user asks to get all company, respond with a JSON object:
  {"action":"fetch_unidir_company","args":{"company_id":""},
    "urlParams":{},
    "retrievePath": "<path>",
    "retrieveParams": "<params>",
    "description": "<rule description>"}
- If the user asks to get all company, but mention reseller or child company with company id respond with a JSON object:
  {"action":"fetch_unidir_company","args":{"company_id":"..."},
    "urlParams":{"companyId":"..."},
    "retrievePath": "<path>",
    "retrieveParams": "<params>",
    "description": "<rule description>"}
    When identifying company id, extract phrases such as:
  • proper names (e.g., "igoodworks", "acme", "stellarTech")
  • tokens after words like "company", "org", "tenant", "business"
  • text inside quotes or following "id"
  If no company ID is confidently found, default to "".

- If the user asks about a domain, respond with a JSON object. retrieveParams domainId should be replaced with actual value of domain_id.:
  {"action":"fetch_unidir_domain","args":{"domain_id":"..."},
    "retrievePath": "<path>",
    "retrieveParams": "<params>",
    "description": "<rule description>"}

- If the user asks about all domains, respond with a JSON object:
  {"action":"fetch_unidir_domain","args":{"domain_id":""},
    "retrievePath": "<path>",
    "retrieveParams": "<params>",
    "description": "<rule description>"}

- If the user asks about a application, respond with a JSON object:
  {"action":"fetch_unidir_application","args":{"application_id":"..."},
    "retrievePath": "<path>",
    "retrieveParams": "<params>",
    "description": "<rule description>"}
    
- If the user asks about all applications, respond with a JSON object:
  {"action":"fetch_unidir_application","args":{"application_id":""},
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
