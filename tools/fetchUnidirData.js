import { safeApiCall } from "../utils/httpClient.js";
import { success, error } from "../utils/response.js";

export async function fetchUnidirData(args = {}) {
  const { endpoint, token } = args;
  if (!endpoint || !token) return error("endpoint and token are required");

  const result = await safeApiCall({
    method: "GET",
    url: endpoint,
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!result.ok) return error(result.error);
  return success(result.data);
}
