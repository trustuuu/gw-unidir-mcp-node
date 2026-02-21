import * as fs from "fs";
import * as path from "path";

interface DatasetEntry {
  contents: [
    { role: "user"; parts: [{ text: string }] },
    { role: "model"; parts: [{ text: string }] },
  ];
}

const numSamples = 1000;
const outputDir = path.join(process.cwd(), "fine-tuning");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Helper to generate a random ID
function generateId() {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const userProps =
  "id, externalId, userName, displayName, nickName, title, userType, preferredLanguage, locale, timezone, active, mfa, status, name, meta, resourceType, emails, phoneNumbers, addresses, Schemas, EnterpriseExtension, customExtension, whenCreated, whenUpdated";
const groupProps =
  "id, name, displayName, email, notes, status, members, whenCreated, whenUpdated";
const companyProps =
  "id, name, displayName, description, parent, status, type, whenCreated";
const domainProps =
  "id, name, description, primary, status, whenCreated, whenUpdated";
const appProps =
  "id, client_id, client_secret, client_name, description, domain, companyId, app_type, logo_uri, status, client_status, audience, grant_types, redirect_uris, allowed_web_orgins, client_uri, client_logout_uri, permissions_consent_screen, id_token_expiration, refresh_absolute_lifetime, refresh_absolute_expiration, refresh_token_rotation, refresh_reuse_interval, client_id_created_at, whenUpdated";
const apiProps =
  "id, name, description, identifier, audience, issuer, companyId, domain, jwksUri, signingAlgorithm, status, RBAC, addPermissionAccessToken, allowSkippingUserConsent, allowOfflineAccess, tokjenExpirationForBrowser, tokenExpiration, whenCreated, whenUpdated, scopes";

const templates = [
  // USER
  {
    prompts: ["Show me all users", "Get all users", "List all users"],
    model: {
      action: "fetch_unidir_user",
      args: { user_id: "" },
      retrievePath: "users",
      retrieveParams: "{'status':'active'}",
      description: "List all users.",
    },
  },
  {
    prompts: [
      "Show me users {id}",
      "View users {id}",
      "Get details for users {id}",
    ],
    model: {
      action: "fetch_unidir_user",
      args: { user_id: "{id}" },
      retrievePath: "users-view",
      retrieveParams: "{'userId':'{id}', 'mode':'view'}",
      description: "show or view a user information.",
    },
  },
  {
    prompts: ["Edit users {id}", "Update user {id}"],
    model: {
      action: "fetch_unidir_user",
      args: { user_id: "{id}" },
      retrievePath: "users-edit",
      retrieveParams: "{'userId':'{id}', 'mode':'edit'}",
      description: `Edit or modify a user information. Available properties: ${userProps}`,
    },
  },
  {
    prompts: [
      "New user",
      "Create a new user",
      "Add user",
      "How do I create a user?",
      "What fields do I need for a new user?",
    ],
    model: {
      action: "fetch_unidir_user",
      args: { user_id: "" },
      retrievePath: "users-new",
      retrieveParams: "{'mode':'new'}",
      description: `Post a new user. Available properties: ${userProps}`,
    },
  },
  {
    prompts: [
      "Show me all deleted users",
      "List all deleted users",
      "Get all deleted users",
    ],
    model: {
      action: "fetch_unidir_user",
      args: { user_id: "" },
      retrievePath: "users-deleted",
      retrieveParams: "{'status':'deleted'}",
      description:
        "List all deleted users but not purged permantally. users can be undeleted or purge permantally.",
    },
  },

  // GROUP
  {
    prompts: ["Show me all groups", "Get all groups", "List all groups"],
    model: {
      action: "fetch_unidir_group",
      args: { group_id: "" },
      retrievePath: "groups",
      retrieveParams: "{'status':'active'}",
      description: "List all groups.",
    },
  },
  {
    prompts: [
      "Show me groups {id}",
      "View groups {id}",
      "Get details for groups {id}",
    ],
    model: {
      action: "fetch_unidir_group",
      args: { group_id: "{id}" },
      retrievePath: "groups-view",
      retrieveParams: "{'groupId':'{id}', 'mode':'view'}",
      description: "show or view a group information.",
    },
  },
  {
    prompts: [
      "about a group information, respond with a JSON object, path and params",
    ],
    model: {
      action: "fetch_unidir_application",
      args: { application_id: "" },
      retrievePath: "applications-brief",
      retrieveParams: "{'mode':'view'}",
      description: "View a application information.",
    },
  },
  {
    prompts: ["Edit groups {id}", "Update group {id}"],
    model: {
      action: "fetch_unidir_group",
      args: { group_id: "{id}" },
      retrievePath: "groups-edit",
      retrieveParams: "{'groupId':'{id}', 'mode':'edit'}",
      description: `Edit or modify a group information. Available properties: ${groupProps}`,
    },
  },
  {
    prompts: [
      "New group",
      "Create a new group",
      "Add group",
      "How do I create a group?",
      "What fields do I need for a new group?",
    ],
    model: {
      action: "fetch_unidir_group",
      args: { group_id: "" },
      retrievePath: "groups-new",
      retrieveParams: "{'mode':'new'}",
      description: `Post a new group. Available properties: ${groupProps}`,
    },
  },
  {
    prompts: [
      "Show me all deleted groups",
      "List all deleted groups",
      "Get all deleted groups",
      "Show me all deleted",
      "List all deleted",
      "Get all deleted",
    ],
    model: {
      action: "fetch_unidir_group",
      args: { group_id: "" },
      retrievePath: "groups-deleted",
      retrieveParams: "{'status':'deleted'}",
      description:
        "List all deleted groups but not purged permantally. groups can be undeleted or purge permantally.",
    },
  },

  // COMPANY
  {
    prompts: [
      "Show me all companies",
      "Get all companies",
      "List all companies",
    ],
    model: {
      action: "fetch_unidir_company",
      args: { company_id: "" },
      retrievePath: "onboarding-companies",
      retrieveParams: '""',
      description: "List all companies.",
    },
  },
  {
    prompts: [
      "Show me onboarding {id}",
      "View onboarding {id}",
      "Get details for onboarding {id}",
    ],
    model: {
      action: "fetch_unidir_company",
      args: { company_id: "{id}" },
      retrievePath: "onboarding-company-new",
      retrieveParams: "{'companyId':'{id}', 'mode':'view'}",
      description: "show or view a company information.",
    },
  },
  {
    prompts: [
      "New company",
      "Create a new company",
      "Add company",
      "How do I create a company?",
      "What fields do I need for a new company?",
    ],
    model: {
      action: "fetch_unidir_company",
      args: { company_id: "" },
      retrievePath: "onboarding-company-new",
      retrieveParams: "{'mode':'new'}",
      description: `Post a new company. Available properties: ${companyProps}`,
    },
  },

  // DOMAIN
  {
    prompts: ["Show me all domains", "Get all domains", "List all domains"],
    model: {
      action: "fetch_unidir_domain",
      args: { domain_id: "" },
      retrievePath: "onboarding-domains",
      retrieveParams: '""',
      description: "List all domains.",
    },
  },
  {
    prompts: [
      "Show me domain {id}",
      "View domain {id}",
      "Get details for domain {id}",
      "Show me onboarding {id}",
      "View onboarding {id}",
      "Get details for onboarding {id}",
    ],
    model: {
      action: "fetch_unidir_domain",
      args: { domain_id: "{id}" },
      retrievePath: "onboarding-domain-new",
      retrieveParams: "{'domainId':'{id}', 'mode':'view'}", // The legacy JSONL mapped domain ID queries with "onboarding {id}"
      description: "show or view a domain information.",
    },
  },
  {
    prompts: [
      "New domain",
      "Create a new domain",
      "Add domain",
      "How do I create a domain?",
      "What fields do I need for a new domain?",
    ],
    model: {
      action: "fetch_unidir_domain",
      args: { domain_id: "" },
      retrievePath: "onboarding-domain-new",
      retrieveParams: "{'mode':'new'}",
      description: `Post a new domain. Available properties: ${domainProps}`,
    },
  },

  // APPLICATION
  {
    prompts: [
      "Show me all applications",
      "Get all applications",
      "List all applications",
    ],
    model: {
      action: "fetch_unidir_application",
      args: { application_id: "" },
      retrievePath: "applications",
      retrieveParams: "{'status':'active'}",
      description: "List all applications.",
    },
  },
  {
    prompts: [
      "to see a application information, respond with a JSON object, path and params",
      "Get application info",
      "Show me application information",
    ],
    model: {
      action: "fetch_unidir_application",
      args: { application_id: "" },
      retrievePath: "applications-view-setting",
      retrieveParams: "{'mode':'view'}",
      description: "View a application information in detail.",
    },
  },
  {
    prompts: [
      "New application",
      "Create a new application",
      "Add application",
      "How do I create a application?",
      "What fields do I need for a new application?",
    ],
    model: {
      action: "fetch_unidir_application",
      args: { application_id: "" },
      retrievePath: "applications-view-post",
      retrieveParams: "{'mode':'new'}",
      description: `Post a application  Available properties: ${appProps}`,
    },
  },
  {
    prompts: [
      "to edit applicaiton permission scopes, respond with a JSON object, path and params",
      "Edit application permissions",
      "Modify application scopes",
    ],
    model: {
      action: "fetch_unidir_application",
      args: { application_id: "" },
      retrievePath: "applications-view-permission-scope",
      retrieveParams: "mode=edit",
      description: `View all permission scopes of a application. Available properties: ${appProps}`,
    },
  },

  // API
  {
    prompts: [
      "Show me all apis",
      "Get all apis",
      "List all apis",
      "Show all APIs",
    ],
    model: {
      action: "fetch_unidir_api",
      args: {},
      retrievePath: "apis",
      retrieveParams: "{'status':'active'}",
      description: "List all apis.",
    },
  },
  {
    prompts: [
      "about a api information, respond with a JSON object, path and params",
      "Get API info",
      "Show API details",
    ],
    model: {
      action: "fetch_unidir_application", // Legacy JSONL maps this to application action actually
      args: { application_id: "" },
      retrievePath: "appis-brief", // Legacy JSONL has this typo "appis-brief"
      retrieveParams: "mode=overview",
      description: "View a api information.",
    },
  },
  {
    prompts: [
      "New api",
      "Create a new api",
      "Add api",
      "How do I create an API?",
      "What fields do I need for a new api?",
    ],
    model: {
      action: "fetch_unidir_api",
      args: { api_id: "" },
      retrievePath: "apis-new",
      retrieveParams: "{'mode':'new'}",
      description: `Post a new api. Available properties: ${apiProps}`,
    },
  },
];

function generateDataset(): DatasetEntry[] {
  const dataset: DatasetEntry[] = [];

  for (let i = 0; i < numSamples; i++) {
    const templateIdx = Math.floor(Math.random() * templates.length);
    const template = templates[templateIdx];

    // Choose a random prompt form the template
    const promptIdx = Math.floor(Math.random() * template.prompts.length);
    let userText = template.prompts[promptIdx];

    // Replace placeholders
    const id = generateId();
    userText = userText.replace(/{id}/g, id);

    const modelObj = JSON.parse(JSON.stringify(template.model));
    if (modelObj.args && modelObj.args.user_id === "{id}")
      modelObj.args.user_id = id;
    if (modelObj.args && modelObj.args.group_id === "{id}")
      modelObj.args.group_id = id;
    if (modelObj.args && modelObj.args.company_id === "{id}")
      modelObj.args.company_id = id;
    if (modelObj.args && modelObj.args.domain_id === "{id}")
      modelObj.args.domain_id = id;

    if (modelObj.retrieveParams.includes("{id}")) {
      modelObj.retrieveParams = modelObj.retrieveParams.replace(/{id}/g, id);
    }

    dataset.push({
      contents: [
        { role: "user", parts: [{ text: userText }] },
        { role: "model", parts: [{ text: JSON.stringify(modelObj) }] },
      ],
    });
  }

  return dataset;
}

const allData = generateDataset();

// Shuffle data
for (let i = allData.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [allData[i], allData[j]] = [allData[j], allData[i]];
}

const trainSplit = Math.floor(allData.length * 0.8);
const valSplit = Math.floor(allData.length * 0.9);

const trainData = allData.slice(0, trainSplit);
const valData = allData.slice(trainSplit, valSplit);
const testData = allData.slice(valSplit);

function writeJsonl(filename: string, data: DatasetEntry[]) {
  const lines = data.map((entry) => JSON.stringify(entry)).join("\n");
  fs.writeFileSync(path.join(outputDir, filename), lines + "\n");
}

writeJsonl("fine_tuning_train.jsonl", trainData);
writeJsonl("fine_tuning_val.jsonl", valData);
writeJsonl("fine_tuning_test.jsonl", testData);
writeJsonl("fine_tuning_dataset.jsonl", allData); // The full combined dataset

console.log(`Generated ${allData.length} records.`);
console.log(
  `Train: ${trainData.length}, Val: ${valData.length}, Test: ${testData.length}`,
);
console.log(`Output saved to ${outputDir}`);
