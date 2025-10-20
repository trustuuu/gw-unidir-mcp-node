import { baseUrl } from "../utils/constants.js";
import { safeApiCall } from "../utils/httpClient.js";
import { success, error } from "../utils/response.js";

/**
 * Common fetch helper used by user/group/etc.
 */
export async function fetchUnidirCommon({
  token,
  company_id,
  domain_id,
  entity_type,
  object_id,
  extend_prop,
  params_json = "{}",
}) {
  let params = {};
  try {
    params = JSON.parse(params_json || "{}");
  } catch (e) {
    console.warn("[WARN] Invalid JSON in params_json");
  }

  // Construct endpoint
  let endpoint = `/companys/${company_id}/domainNames/${domain_id}/${entity_type}/`;

  // For 'user' or 'group', object_id is optional
  if (entity_type !== "user" && entity_type !== "group" && object_id) {
    endpoint += `${object_id}`;
  }

  if (extend_prop) {
    endpoint += `/${extend_prop}`;
  }

  console.log(`[FETCH] endpoint => ${endpoint}`);

  //const baseUrl = process.env.UNIDIR_API_BASE || "http://oauth.biocloud.pro/v1";
  const fullUrl = baseUrl.replace(/\/$/, "") + endpoint;

  const result = await safeApiCall({
    method: "GET",
    url: fullUrl,
    headers: { Authorization: `Bearer ${token}` },
    params,
  });

  if (!result.ok) return error(result.error);
  return success(result.data);
}
