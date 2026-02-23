import { exchangeTokenForDelegation } from "./utils/tokenExchange.js";
import { safeApiCall } from "./utils/httpClient.js";

async function testFetchAndExchange() {
  const MOCK_OR_REAL_USER_TOKEN = process.argv[2]; // Pass token via CLI arg

  if (!MOCK_OR_REAL_USER_TOKEN) {
    console.error("Please provide a user Bearer token as the first argument.");
    process.exit(1);
  }

  console.log("Exchanging token for downstream DPoP delegated token...");
  try {
    const delegatedToken = await exchangeTokenForDelegation(
      MOCK_OR_REAL_USER_TOKEN,
    );
    console.log(
      "Delegated Token Acquired:",
      delegatedToken?.substring(0, 30) + "...",
    );

    // Now make a request simulating the agent tools e.g., fetching a user
    const endpoint = "http://localhost/v1/users/Peter%20Kim"; // Example URL
    console.log(`Making request to ${endpoint}`);

    const result = await safeApiCall({
      method: "GET",
      url: endpoint,
      headers: { Authorization: `Bearer ${delegatedToken}` },
    });

    console.log("Result:", result);
  } catch (e) {
    console.error("Test Failed:", e.message);
  }
}

testFetchAndExchange();
