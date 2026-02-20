import axios from "axios";
import { generateDpopProof } from "./DPoPManager.js";

export async function safeApiCall(config) {
  try {
    // Generate DPoP proof if Authorization header is present
    if (config.headers?.Authorization) {
      const accessToken = config.headers.Authorization.replace("Bearer ", "");
      const url = config.url;
      const method = (config.method || "GET").toUpperCase();

      try {
        // We need DPoPManager.js import
        // DPoPManager is async, generateDpopProof(url, method, accessToken)
        const dpopProof = await generateDpopProof(url, method, accessToken);
        config.headers.DPoP = dpopProof;
        // console.log(`[HttpClient] Added DPoP proof to ${method} ${url}`);
      } catch (dpopErr) {
        console.warn(
          "[HttpClient] Failed to generate DPoP proof:",
          dpopErr.message,
        );
      }
    }

    const resp = await axios(config);
    return { ok: true, data: resp.data };
  } catch (err) {
    const msg =
      err.response?.data?.error_description ||
      err.response?.data?.error ||
      err.message ||
      "Unknown error";
    return { ok: false, error: msg };
  }
}
