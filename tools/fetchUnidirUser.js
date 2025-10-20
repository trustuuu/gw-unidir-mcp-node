import { success, error } from "../utils/response.js";
import { fetchUnidirCommon } from "./fetchUnidirCommon.js";

/**
 * Fetch a specific user in a company/domain using JWT.
 */
export async function fetchUnidirUser(args = {}) {
  const {
    company_id,
    domain_id,
    token,
    user_id = null,
    extend_prop = null,
    params_json = "{}",
  } = args;

  if (!company_id || !domain_id || !token) {
    return error("company_id, domain_id, and token are required");
  }

  const entity_type = "users";
  return await fetchUnidirCommon({
    token,
    company_id,
    domain_id,
    entity_type,
    object_id: user_id,
    extend_prop,
    params_json,
  });
}

/*
curl -X POST http:///172.30.48.1:8081/call_tool \
  -H "Content-Type: application/json" \
  -d '{
    "name": "fetch_unidir_user",
    "arguments": {
      "company_id": "igoodworks",
      "domain_id": "igoodworks.com",
      "user_id": "james.chang",
      "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IjkzRmNiN0NrNEJNanUydU5tdTh5UndQdzVTRXdSaFRNRiJ9.eyJpc3MiOiJodHRwOi8vb2F1dGgudW5pZGlyLmlnb29kd29ya3MuY29tLyIsInN1YiI6IlVuaXZlcnNhbERpcmVjdG9yeSIsImF1ZCI6Imh0dHA6Ly91bmlkaXIuYXBpLmlnb29kd29ya3MuY29tLyIsImlhdCI6MTc2MDk0MzM2NywiZXhwIjoxNzYxMDI5NzY3LCJqdGkiOiJMWGd1eFpHbSIsInBlcm1pc3Npb25zIjpbImNvbXBhbnk6YWRtaW4iLCJjb21wYW55OnJlYWQiLCJjb21wYW55OndyaXRlIiwiZ3JvdXA6cmVhZCIsInVzZXI6cmVhZCJdLCJyb2xlcyI6W10sInRlbmFudF9pZCI6Imlnb29kd29ya3MiLCJjbGllbnRfaWQiOiJhZGZhZHN2VkVUVlZkZmRmdFZERFNEVkRrZGZkZm5kZiIsImNvbXBhbnlJZCI6Imlnb29kd29ya3MiLCJkb21haW5JZCI6Imlnb29kd29ya3MuY29tIiwidG9rZW5fdXNlIjoiYWNjZXNzIn0.GzrXXEEfLqUZBMwBb9M1Ej_kO-hkS7ufA29JAlY5TR076gMLT8O0Aux045pSn8FocqDpWHkuRSbObirkpcSg8nxluy-dzNa_FavvBwVyGTLQnOyFktSC_fbvxnzFvqL3uruhcZOjqe9iiUrO8rm5vXK1uieNNJBzIyFsOtarebK5PaoWJcfPPRFdKtYUedseOxY38zxSqEBKicAKt8riF_PPeuYInhgB_Oxsgq0NldGx2U0bZtqOa0upX-lVe9g8qKiZ-b3LnX1npQLS5bzJutPMZERdCQ6FOFCjjN7Tvx2FaPVnsdqGJmIVOncH2KxJL47D5WUZc_IyFW226_OXkQ",
      "extend_prop": "AppRoles"
    }
  }'
*/
