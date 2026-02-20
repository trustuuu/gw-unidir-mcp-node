import * as jose from "jose";
import fs from "fs/promises";
import path from "path";

const KEY_FILE = path.join(process.cwd(), "dpop-keys.json");
let keyPair = null;

/**
 * Get or create DPoP key pair (ES256)
 * Stores keys in dpop-keys.json
 */
export async function getOrCreateKeyPair() {
  if (keyPair) return keyPair;

  try {
    // Try to load from file
    const fileContent = await fs.readFile(KEY_FILE, "utf-8");
    const storedKeys = JSON.parse(fileContent);

    // Import keys
    const publicKey = await jose.importJWK(storedKeys.publicKey, "ES256");
    const privateKey = await jose.importJWK(storedKeys.privateKey, "ES256");

    keyPair = { publicKey, privateKey };
    console.log("[DPoP] Loaded existing keys from disk");
  } catch (err) {
    // Generate new keys if missing or error
    console.log("[DPoP] Generating new ES256 key pair...");
    const { publicKey, privateKey } = await jose.generateKeyPair("ES256", {
      extractable: true, // Node.js keys need to be exported to save
    });

    keyPair = { publicKey, privateKey };

    // Save to disk
    const publicJwk = await jose.exportJWK(publicKey);
    const privateJwk = await jose.exportJWK(privateKey);

    await fs.writeFile(
      KEY_FILE,
      JSON.stringify({ publicKey: publicJwk, privateKey: privateJwk }, null, 2),
    );
    console.log("[DPoP] Saved new keys to", KEY_FILE);
  }

  return keyPair;
}

/**
 * Generate DPoP Proof JWT
 * @param {string} url - Full URL of the request
 * @param {string} method - HTTP method
 * @param {string} accessToken - Optional access token to bind hash (ath)
 */
export async function generateDpopProof(url, method, accessToken) {
  const keys = await getOrCreateKeyPair();

  const header = {
    typ: "dpop+jwt",
    alg: "ES256",
    jwk: await jose.exportJWK(keys.publicKey),
  };

  const payload = {
    jti: crypto.randomUUID(),
    htm: method,
    htu: url,
    iat: Math.floor(Date.now() / 1000),
  };

  if (accessToken) {
    // Calculate access token hash
    const ath = await calculateAth(accessToken);
    payload.ath = ath;
  }

  const jwt = await new jose.SignJWT(payload)
    .setProtectedHeader(header)
    .setIssuedAt()
    .sign(keys.privateKey);

  return jwt;
}

/**
 * Calculate Access Token Hash (S256)
 */
async function calculateAth(accessToken) {
  const encoder = new TextEncoder();
  const data = encoder.encode(accessToken);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  // Implementation of base64url encoding
  const base64String = btoa(String.fromCharCode(...hashArray));
  return base64String
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
