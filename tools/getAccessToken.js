import dotenv from "dotenv";
import { safeApiCall } from "../utils/httpClient.js";
import { success, error } from "../utils/response.js";
dotenv.config();

export async function getAccessToken(args = {}) {
  const tokenUrl = process.env.UNIDIR_TOKEN_URL;
  const data = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: args.client_id,
    client_secret: args.client_secret,
  });

  const result = await safeApiCall({
    method: "POST",
    url: tokenUrl,
    data,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  if (!result.ok) return error(result.error);
  return success(result.data.access_token);
}
