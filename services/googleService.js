// googleService.js
import axios from "axios";
// import externalIdentityAccountService from "./services/externalIdentityAccountService.js";
// import connectionService from "./services/connectionService.js";

/**
 * Load ExternalIdentityAccount (Google)
 */
export async function getGoogleAccount(userId, companyId, domainId) {
  const account = {};
  //   const account = await externalIdentityAccountService.getByUserAndProvider({
  //     userId,
  //     companyId,
  //     domainId,
  //     provider: "google",
  //   });

  if (!account) {
    throw new Error("Google ExternalIdentityAccount not found");
  }

  return account;
}

/**
 * Check expiration (60-second buffer)
 */
function isTokenValid(account) {
  const now = Math.floor(Date.now() / 1000);
  return (
    account.providerAccessToken &&
    account.providerAccessExpiresAt &&
    account.providerAccessExpiresAt - now > 60
  );
}

/**
 * Refresh Google Access Token using refresh_token
 */
export async function refreshGoogleAccessToken(account, connection) {
  const params = new URLSearchParams();
  params.append("client_id", connection.clientId);
  params.append("client_secret", connection.clientSecret);
  params.append("grant_type", "refresh_token");
  params.append("refresh_token", account.providerRefreshToken);

  const resp = await axios.post(
    "https://oauth2.googleapis.com/token",
    params.toString(),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );

  //   const resp = await fetch("https://oauth2.googleapis.com/token", {
  //     method: "POST",
  //     headers: { "Content-Type": "application/x-www-form-urlencoded" },
  //     body: params.toString(),
  //   });

  if (!resp.ok) {
    throw new Error("Google token refresh failed");
  }

  const data = await resp.json();

  const now = Math.floor(Date.now() / 1000);

  const updated = {
    ...account,
    providerAccessToken: data.access_token,
    providerAccessExpiresAt: now + data.expires_in,
    providerRefreshToken: data.refresh_token ?? account.providerRefreshToken,
    providerScopes: data.scope?.split(" ") ?? account.providerScopes,
  };

  // Save updated account
  await externalIdentityAccountService.updateAccount(updated);

  return updated;
}

/**
 * Ensure valid access token
 */
export async function ensureGoogleToken(account, connection) {
  if (isTokenValid(account)) {
    return account.providerAccessToken;
  }
  return (await refreshGoogleAccessToken(account, connection))
    .providerAccessToken;
}

/**
 * Call Google Calendar API
 */
export async function getGoogleCalendarEvents(accessToken) {
  const url = "https://www.googleapis.com/calendar/v3/calendars/primary/events";

  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Google Calendar API error: ${body}`);
  }

  return await resp.json();
}
