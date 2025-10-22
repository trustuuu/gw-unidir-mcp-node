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
  console.log("data", data);
  const result = await safeApiCall({
    method: "POST",
    url: tokenUrl,
    data,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  if (!result.ok) return error(result.error);
  return success(result.data.access_token);
}

/*
curl http://localhost:8080/

curl -X POST https://unidir-mcp.biocloud.pro/call_tool \
  -H "Content-Type: application/json" \
  -d '{
        "name": "get_access_token",
       "arguments": {
            "client_id": "adfadsvVETVVdfdftVDDSDVDkdfdfndf",
            "client_secret":"9SmSkvoLuGeFfA7IHsjb31cOPl1CPwgn"
            }
      }'

  
*/
