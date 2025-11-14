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
      "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IjkzRmNiN0NrNEJNanUydU5tdTh5UndQdzVTRXdSaFRNRiJ9.eyJpc3MiOiJodHRwOi8vb2F1dGgudW5pZGlyLmlnb29kd29ya3MuY29tLyIsInN1YiI6IlVuaXZlcnNhbERpcmVjdG9yeSIsImF1ZCI6Imh0dHA6Ly91bmlkaXIuYXBpLmlnb29kd29ya3MuY29tLyIsImlhdCI6MTc2Mjk5NDUzMSwiZXhwIjoxNzYzMDgwOTMxLCJqdGkiOiJYUUhWWms4ZCIsInBlcm1pc3Npb25zIjpbImNvbXBhbnk6YWRtaW4iLCJjb21wYW55OmRlbGV0ZSIsImNvbXBhbnk6cmVhZCIsImNvbXBhbnk6d3JpdGUiLCJlbWFpbCIsImVtYWlsX3ZlcmlmaWVkIiwiZ3JvdXA6cmVhZCIsIm9wZW5JZCIsInByb2ZpbGUiLCJ1c2VyOmFkbWluIiwidXNlcjpyZWFkIiwidXNlcm5hbWUiXSwicm9sZXMiOltdLCJ0ZW5hbnRfaWQiOiJpZ29vZHdvcmtzIiwiY2xpZW50X2lkIjoiYWRmYWRzdlZFVFZWZGZkZnRWRERTRFZEa2RmZGZuZGYiLCJjb21wYW55SWQiOiJpZ29vZHdvcmtzIiwiZG9tYWluSWQiOiJpZ29vZHdvcmtzLmNvbSIsInRva2VuX3VzZSI6ImFjY2VzcyJ9.T6_T3pPNwj_lO__SNsQs_TMwsvCwNQkCM0xFDfu3__3eH0TRJtK9AMvQWzzyatIktIoeFq9ByjZwkTpubjeGRB8PTDtKDD9NBh5JmsWWgzOYpT_fScPkIKpAKU8PVENsebMXvwIs5CA8Oa0jZDRBFsF0v4S3FzluZVy5z8qSVMLrgYWqldYqf1xSwz8CPBsMSey7qk8e5HsYeTMISDACnkssVUgYdjI5qkqDS8vDW7-af_FZ2uHzaGhwj2HbJl44ug9r_hKYVQVyP1g_7WgK4hNtY2phNocPp1xL-zQGibLnYbR9d8EhesXrac_qfUzeXWyiWzXbDAGGzuhIMT3voQ",
      "extend_prop": "AppRoles"
    }
  }'
*/
