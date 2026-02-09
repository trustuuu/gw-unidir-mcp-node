import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputFile = path.join(__dirname, "../ingest/api-docs/unidir_page.json");
const userTypeFile = path.join(__dirname, "../types/User.d.ts");
const groupTypeFile = path.join(__dirname, "../types/Group.d.ts");
const companyTypeFile = path.join(__dirname, "../types/Company.d.ts");
const domainTypeFile = path.join(__dirname, "../types/Domain.d.ts");
const appTypeFile = path.join(__dirname, "../types/Application.d.ts");
const apiTypeFile = path.join(__dirname, "../types/Api.d.ts");
const outputFile = path.join(__dirname, "../fine_tuning_dataset.jsonl");

const rawData = fs.readFileSync(inputFile, "utf-8");
const schema = JSON.parse(rawData);
const rules = schema.rules;

// --- ID Generation Helper ---
function generateId(prefix) {
  return prefix + Math.random().toString(36).substring(7);
}

// --- Type Parsing Helper ---
function parseInterface(filePath, interfaceName) {
  if (!fs.existsSync(filePath)) return "";
  const content = fs.readFileSync(filePath, "utf-8");

  // Simple regex to extract the block.
  // Matches "export interface InterfaceName {" until the closing "}" at start of line or similar.
  // This is a naive parser but sufficient for well-formatted d.ts files.
  const startRegex = new RegExp(`export interface ${interfaceName}\\s*{`, "m");
  const startMatch = content.match(startRegex);

  if (!startMatch) return "";

  const startIndex = startMatch.index + startMatch[0].length;
  let braceCount = 1;
  let endIndex = startIndex;

  for (let i = startIndex; i < content.length; i++) {
    if (content[i] === "{") braceCount++;
    else if (content[i] === "}") braceCount--;

    if (braceCount === 0) {
      endIndex = i;
      break;
    }
  }

  const block = content.substring(startIndex, endIndex);

  // Extract lines that look like "key: type;" or "key?: type;"
  const lines = block
    .split("\n")
    .map((l) => l.trim())
    .filter(
      (l) =>
        l && !l.startsWith("//") && !l.startsWith("/*") && !l.startsWith("*"),
    );

  const properties = lines
    .map((line) => {
      // Remove comments at end of line
      const code = line.split("//")[0].trim();
      const match = code.match(/^([a-zA-Z0-9_$]+)(\??)\s*:\s*(.+);?$/);
      if (match) {
        return match[1]; // Return the key name
      }
      return null;
    })
    .filter(Boolean);

  return properties.join(", ");
}

const userProperties = parseInterface(userTypeFile, "IUser");
const groupProperties = parseInterface(groupTypeFile, "IGroup");
const companyProperties = parseInterface(companyTypeFile, "Company");
const domainProperties = parseInterface(domainTypeFile, "Domain");
const appProperties = parseInterface(appTypeFile, "Application");
const apiProperties = parseInterface(apiTypeFile, "Api");

// Helper to determine MCP action based on path or description
function inferAction(rule) {
  const p = rule.path.toLowerCase();
  if (p.includes("user")) return "fetch_unidir_user";
  if (p.includes("group")) return "fetch_unidir_group";
  if (p.includes("company") || p.includes("onboarding-companies"))
    return "fetch_unidir_company";
  if (p.includes("domain")) return "fetch_unidir_domain";
  if (p.includes("application") || p.includes("app"))
    return "fetch_unidir_application";
  if (p.includes("api")) return "fetch_unidir_api";
  return "navigate_only";
}

// Helper to generate synthetic variations of user prompts
function generatePrompts(rule, placeholders, typeInfo) {
  const text = rule.rule.replace(/^If the user asks /, "").replace(/\.$/, "");
  const prompts = [];

  const p = rule.path.toLowerCase();
  const desc = rule.description.toLowerCase();
  const isNew =
    rule.params.includes("'mode':'new'") || rule.params.includes("mode=new");
  const isEdit =
    rule.params.includes("'mode':'edit'") || rule.params.includes("mode=edit");

  // Common patterns
  if (desc.includes("list all")) {
    const entity = rule.path.split("-").pop(); // e.g. 'users', 'groups'
    prompts.push(`List all ${entity}`);
    prompts.push(`Show me all ${entity}`);
    prompts.push(`Get all ${entity}`);
  } else if (placeholders.id) {
    const entity = rule.path.split("-")[0].replace("onboarding-", "");
    prompts.push(`Show me ${entity} ${placeholders.id}`);
    prompts.push(`Get details for ${entity} ${placeholders.id}`);
    prompts.push(`View ${entity} ${placeholders.id}`);
  } else if (isNew) {
    let entity = "item";
    if (p.includes("user")) entity = "user";
    else if (p.includes("group")) entity = "group";
    else if (p.includes("domain")) entity = "domain";
    else if (p.includes("company")) entity = "company";
    else if (p.includes("application")) entity = "application";
    else if (p.includes("api")) entity = "api";

    prompts.push(`Create a new ${entity}`);
    prompts.push(`Add ${entity}`);
    prompts.push(`New ${entity}`);

    if (typeInfo) {
      prompts.push(`How do I create a ${entity}?`);
      prompts.push(`What fields do I need for a new ${entity}?`);
    }
  } else if (isEdit && placeholders.id) {
    let entity = "item";
    if (p.includes("user")) entity = "user";
    else if (p.includes("group")) entity = "group";
    // Add others if they support edit logic with IDs in your rules
    // Currently user/group/domain/app likely fall here if rules exist

    prompts.push(`Edit ${entity} ${placeholders.id}`);
    prompts.push(`Update ${entity} ${placeholders.id}`);
    prompts.push(`Modify ${entity} ${placeholders.id}`);

    if (typeInfo) {
      prompts.push(`What can I update on ${entity} ${placeholders.id}?`);
    }
  } else {
    prompts.push(text);
  }

  return prompts;
}

// Helper to extract placeholders and generate mock values
function getMockValues(paramString) {
  const mocks = {};
  if (!paramString) return { values: {}, cleanedParams: "" };

  let cleanedParams = paramString;

  if (paramString.includes("{company_id}")) {
    mocks.id = generateId("Cm");
    cleanedParams = cleanedParams.replace("{company_id}", `'${mocks.id}'`);
    mocks.argName = "company_id";
  }
  if (paramString.includes("{domain_id}")) {
    mocks.id = generateId("Dm");
    cleanedParams = cleanedParams.replace("{domain_id}", `'${mocks.id}'`);
    mocks.argName = "domain_id";
  }
  if (paramString.includes("{user_id}")) {
    mocks.id = generateId("Us");
    cleanedParams = cleanedParams.replace("{user_id}", `'${mocks.id}'`);
    mocks.argName = "user_id";
  }
  if (paramString.includes("{group_id}")) {
    mocks.id = generateId("Gr");
    cleanedParams = cleanedParams.replace("{group_id}", `'${mocks.id}'`);
    mocks.argName = "group_id";
  }
  if (paramString.includes("{application_id}")) {
    mocks.id = generateId("Ap");
    cleanedParams = cleanedParams.replace("{application_id}", `'${mocks.id}'`);
    mocks.argName = "application_id";
  }

  return { values: mocks, cleanedParams };
}

const dataset = [];

rules.forEach((rule) => {
  // 1. Determine Action
  const actionName = inferAction(rule);

  // 2. Determine Type Context
  let typeProperties = "";

  // Check params loosely for new/edit
  const pParams = rule.params || "";
  const isNew =
    pParams.includes("'mode':'new'") ||
    pParams.includes("mode=new") ||
    pParams.includes('"mode":"new"');
  const isEdit =
    pParams.includes("'mode':'edit'") ||
    pParams.includes("mode=edit") ||
    pParams.includes('"mode":"edit"');

  if (isNew || isEdit) {
    if (actionName === "fetch_unidir_user") typeProperties = userProperties;
    else if (actionName === "fetch_unidir_group")
      typeProperties = groupProperties;
    else if (actionName === "fetch_unidir_company")
      typeProperties = companyProperties;
    else if (actionName === "fetch_unidir_domain")
      typeProperties = domainProperties;
    else if (actionName === "fetch_unidir_application")
      typeProperties = appProperties;
    else if (actionName === "fetch_unidir_api") typeProperties = apiProperties;
  }

  // 3. Generate examples
  const loops = 5;
  for (let i = 0; i < loops; i++) {
    const { values, cleanedParams } = getMockValues(rule.params);

    // Construct Args
    let args = {};
    if (values.argName && values.id) {
      args[values.argName] = values.id;
    } else {
      if (actionName === "fetch_unidir_user") args["user_id"] = "";
      if (actionName === "fetch_unidir_group") args["group_id"] = "";
      if (actionName === "fetch_unidir_company") args["company_id"] = "";
      if (actionName === "fetch_unidir_domain") args["domain_id"] = "";
      if (actionName === "fetch_unidir_application")
        args["application_id"] = "";
    }

    // Enhance description with type info if available
    let description = rule.description;
    if (typeProperties) {
      description += ` Available properties: ${typeProperties}`;
    }

    const outputObject = {
      action: actionName,
      args: args,
      retrievePath: rule.path,
      retrieveParams: cleanedParams,
      description: description,
    };

    const prompts = generatePrompts(rule, values, !!typeProperties);
    if (prompts.length === 0) prompts.push(rule.rule);

    const userPrompt = prompts[i % prompts.length];

    dataset.push({
      contents: [
        { role: "user", parts: [{ text: userPrompt }] },
        { role: "model", parts: [{ text: JSON.stringify(outputObject) }] },
      ],
    });
  }
});

// Shuffle dataset
for (let i = dataset.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [dataset[i], dataset[j]] = [dataset[j], dataset[i]];
}

const total = dataset.length;
const trainSize = Math.floor(total * 0.8);
const valSize = Math.floor(total * 0.1);
const testSize = total - trainSize - valSize;

const trainSet = dataset.slice(0, trainSize);
const valSet = dataset.slice(trainSize, trainSize + valSize);
const testSet = dataset.slice(trainSize + valSize);

const trainFile = path.join(__dirname, "../fine_tuning_train.jsonl");
const valFile = path.join(__dirname, "../fine_tuning_val.jsonl");
const testFile = path.join(__dirname, "../fine_tuning_test.jsonl");

fs.writeFileSync(outputFile, dataset.map((d) => JSON.stringify(d)).join("\n"));
fs.writeFileSync(trainFile, trainSet.map((d) => JSON.stringify(d)).join("\n"));
fs.writeFileSync(valFile, valSet.map((d) => JSON.stringify(d)).join("\n"));
fs.writeFileSync(testFile, testSet.map((d) => JSON.stringify(d)).join("\n"));

console.log(`Generated ${dataset.length} total examples.`);
console.log(`Training: ${trainSet.length} examples in ${trainFile}`);
console.log(`Validation: ${valSet.length} examples in ${valFile}`);
console.log(`Test: ${testSet.length} examples in ${testFile}`);
