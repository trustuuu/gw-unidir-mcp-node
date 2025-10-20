import { baseUrl } from "../utils/constants.js";
import { safeApiCall } from "../utils/httpClient.js";
import { success, error } from "../utils/response.js";

/**
 * Unified CRUD for UniDir API
 * Supports POST, PUT, PATCH, DELETE
 */
export async function modifyUnidirData(args = {}) {
  const { token, endpoint, method = "POST", body_json = "{}" } = args;

  if (!token || !endpoint) return error("token and endpoint are required");

  const httpMethod = method.toUpperCase();
  const allowed = ["POST", "PUT", "PATCH", "DELETE"];
  if (!allowed.includes(httpMethod))
    return error(
      `Invalid method: ${method}. Must be one of ${allowed.join(", ")}`
    );

  let body = {};
  if (httpMethod !== "DELETE") {
    try {
      body = JSON.parse(body_json || "{}");
    } catch {
      return error("Invalid JSON in body_json");
    }
  }

  //const baseUrl = process.env.UNIDIR_API_BASE || "http://oauth.biocloud.pro/v1";
  const url = baseUrl.replace(/\/$/, "") + endpoint;

  const result = await safeApiCall({
    method: httpMethod,
    url,
    headers: { Authorization: `Bearer ${token}` },
    data: httpMethod !== "DELETE" ? body : undefined,
  });

  if (!result.ok)
    return error(`${httpMethod} failed: ${result.error || "Unknown error"}`);

  return success({
    message: `${httpMethod} succeeded`,
    result: result.data,
  });
}

/*
curl -X POST http://localhost:8080/call_tool \
  -H "Content-Type: application/json" \
  -d '{
    "name": "modify_unidir_data",
    "arguments": {
      "method": "POST",
      "token": "eyJhbGciOiJSUzI1NiIs...",
      "endpoint": "/companys/igoodworks/domainNames/igoodworks.com/users",
      "body_json": "{\"email\":\"new.user@igoodworks.com\",\"displayName\":\"New User\"}"
    }
  }'

  curl -X POST http://localhost:8080/call_tool \
  -H "Content-Type: application/json" \
  -d '{
    "name": "modify_unidir_data",
    "arguments": {
      "method": "PUT",
      "token": "eyJhbGciOiJSUzI1NiIs...",
      "endpoint": "/companys/igoodworks/domainNames/igoodworks.com/users/james.chang",
      "body_json": "{\"displayName\":\"James Updated\"}"
    }
  }'

  curl -X POST http://localhost:8080/call_tool \
  -H "Content-Type: application/json" \
  -d '{
    "name": "modify_unidir_data",
    "arguments": {
      "method": "PATCH",
      "token": "eyJhbGciOiJSUzI1NiIs...",
      "endpoint": "/companys/igoodworks/domainNames/igoodworks.com/users/james.chang",
      "body_json": "{\"phoneNumber\":\"604-123-4567\"}"
    }
  }'

  curl -X POST http://localhost:8080/call_tool \
  -H "Content-Type: application/json" \
  -d '{
    "name": "modify_unidir_data",
    "arguments": {
      "method": "DELETE",
      "token": "eyJhbGciOiJSUzI1NiIs...",
      "endpoint": "/companys/igoodworks/domainNames/igoodworks.com/users/james.chang"
    }
  }'

*/
