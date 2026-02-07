// verifyDownstream.js
import jwks from "jwks-rsa";
import { expressjwt } from "express-jwt";

export const authenticateDownstream = expressjwt({
  secret: jwks.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 10,
    jwksUri: process.env.UNIDIR_JWKS, // JWKS from UniDir OAuth Server
  }),
  audience: process.env.EXPECTED_AUDIENCE, // e.g. "google-calendar-api"
  issuer: process.env.UNIDIR_ISSUER,
  algorithms: ["RS256"],
});
