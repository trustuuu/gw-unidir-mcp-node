import axios from "axios";
import { generateDpopProof } from "./DPoPManager.js";
import dotenv from "dotenv";

dotenv.config();

// Simple in-memory cache: { [subjectTokenHash]: { accessToken, expiresAt } }
const tokenCache = new Map();

/**
 * Exchange a user's access token for a delegated service token
 * bound to this Node server's DPoP key.
 *
 * @param {string} subjectToken - The user's access token
 * @returns {Promise<string>} - The new delegated access token
 */
export async function exchangeTokenForDelegation(subjectToken) {
  if (!subjectToken) throw new Error("Subject token is required for exchange");

  const tokenUrl = process.env.UNIDIR_TOKEN_URL;
  const clientId = process.env.UNIDIR_CLIENT_ID;
  const clientSecret = process.env.UNIDIR_CLIENT_SECRET;
  console.log("tokenUrl", tokenUrl);
  console.log("clientId", clientId);
  console.log("clientSecret", clientSecret);
  if (!tokenUrl || !clientId || !clientSecret) {
    throw new Error(
      "Missing OAuth configuration (UNIDIR_TOKEN_URL, CLIENT_ID, CLIENT_SECRET)",
    );
  }

  // Check cache (using simple slice as key for now, ideal would be hash)
  const cacheKey = subjectToken.slice(-20);
  const cached = tokenCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.accessToken;
  }

  try {
    // Generate DPoP proof for the token endpoint
    const dpopProof = await generateDpopProof(tokenUrl, "POST");

    const params = new URLSearchParams();
    params.append(
      "grant_type",
      "urn:ietf:params:oauth:grant-type:token-exchange",
    );
    params.append("client_id", clientId);
    params.append("client_secret", clientSecret);
    params.append("subject_token", subjectToken);
    params.append("resource", process.env.UNIDIR_AUDIENCE);
    params.append(
      "subject_token_type",
      "urn:ietf:params:oauth:token-type:access_token",
    );
    // Requesting same scopes as subject or specific ones?
    // Usually we want to maintain the scopes.
    // params.append("scope", "openid profile email ...");

    console.log("[TokenExchange] Exchanging user token for delegated token...");

    const response = await axios.post(tokenUrl, params, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        DPoP: dpopProof,
      },
    });

    const { access_token, expires_in } = response.data;

    // Cache it (buffer of 30s)
    const expiresAt = Date.now() + (expires_in - 30) * 1000;
    tokenCache.set(cacheKey, { accessToken: access_token, expiresAt });

    console.log("[TokenExchange] Success! Got delegated token.");
    return access_token;
  } catch (err) {
    console.error(
      "[TokenExchange] Error exchanging token:",
      err.response?.data || err.message,
    );
    throw new Error("Failed to exchange token for delegation");
  }
}
