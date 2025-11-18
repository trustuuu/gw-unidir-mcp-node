import { baseUrl } from "../utils/constants.js";
import { safeApiCall } from "../utils/httpClient.js";
import { success, error } from "../utils/response.js";
import { fetchUnidirCommon } from "./fetchUnidirCommon.js";

/**
 * Fetch a specific user in a company/domain using JWT.
 */
export async function fetchUnidirDomain(args = {}) {
  const {
    company_id = null,
    domain_id = null,
    token,
    extend_prop = null,
    params_json = "{}",
  } = args;
  let params = {};
  try {
    params = JSON.parse(params_json || "{}");
  } catch (e) {
    console.warn("[WARN] Invalid JSON in params_json");
  }

  let endpoint = `/companys/${company_id}/domainNames`;
  if (domain_id) {
    endpoint += `/${domain_id}`;
  }

  if (extend_prop) {
    endpoint += `/${extend_prop}`;
  }

  console.log(`[FETCH] endpoint => ${endpoint}`);
  const fullUrl = baseUrl.replace(/\/$/, "") + endpoint;
  console.log("fullUrl", fullUrl);
  const result = await safeApiCall({
    method: "GET",
    url: fullUrl,
    headers: { Authorization: `Bearer ${token}` },
    params,
  });
  console.log("result.data", result.data);
  if (!result.ok) return error(result.error);
  return success(result.data);
}

/*
  curl -X POST http:///172.30.48.1:8081/call_tool \
  -H "Content-Type: application/json" \
  -d '{
    "name": "fetch_unidir_domain",
    "arguments": {
      "company_id": "igoodworks",
      "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6InZPbGxpMUhaV2dfaHh2cGwwVnlKeiJ9.eyJpc3MiOiJodHRwOi8vb2F1dGgudW5pZGlyLmlnb29kd29ya3MuY29tLyIsInN1YiI6ImphbWVzLmNoYW5nIiwiYXVkIjoiaHR0cDovL3VuaWRpci5hcGkuaWdvb2R3b3Jrcy5jb20vIiwiaWF0IjoxNzYzNDAzNDgxLCJleHAiOjE3NjM0ODk4ODEsImp0aSI6ImdsYmZQVlI2IiwicGVybWlzc2lvbnMiOlsiY29tcGFueTphZG1pbiIsImNvbXBhbnk6ZGVsZXRlIiwiY29tcGFueTpyZWFkIiwiY29tcGFueTp3cml0ZSIsImVtYWlsIiwiZW1haWxfdmVyaWZpZWQiLCJncm91cDpyZWFkIiwib3BlbklkIiwicHJvZmlsZSIsInVzZXI6YWRtaW4iLCJ1c2VyOnJlYWQiLCJ1c2VybmFtZSJdLCJyb2xlcyI6WyJPcHM6QWRtaW4iLCJPcHM6U3VwcG9ydCJdLCJ0ZW5hbnRfaWQiOiJpZ29vZHdvcmtzIiwiY2xpZW50X2lkIjoic2llOEwyVm45Z1ZpWm1DQ2RSWXV3NzJiNEo5M201a0kiLCJjb21wYW55SWQiOiJpZ29vZHdvcmtzIiwiZG9tYWluSWQiOiJpZ29vZHdvcmtzLmNvbSIsInRva2VuX3VzZSI6ImFjY2VzcyJ9.EHZCdTiH1l_CvkotdFIz2UossWtXxrEzKaXx6Cpesjx8ntPJ0pLCNpzY4DnjJsuxA96aWP9G9j2Eg4shFcp3DWp_KGbTKlxJQepgkN8ayIQtDm-gdr-EYfDWXP5VBVf2mzdYxAaRYUvc4VnUH6O_YGvbh18CZAKBApNw8ZCIupBc9UyVeqlxvtgvMeEkHG-e9vXVE2nTrWgoneeRlIC0xC0gr5Ij2LiLTnzpx4Lg5gTu30LWiuRKNc5DJUTn4qotpVk3rRf_Ck83dH74fqd_gBC_XY7cbddZxq5IlVk4AD21AQ8lfK_JxyuBku6JeRE-noh4ae0HE2NGSh3BdkXYDQ"
    }
  }'


  curl -X POST http:///172.30.48.1:8081/call_tool \
  -H "Content-Type: application/json" \
  -d '{
    "name": "fetch_unidir_domain",
    "arguments": {
      "company_id": "igoodworks",
      "domain_id" : "igoodworks.com",
      "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IjkzRmNiN0NrNEJNanUydU5tdTh5UndQdzVTRXdSaFRNRiJ9.eyJpc3MiOiJodHRwOi8vb2F1dGgudW5pZGlyLmlnb29kd29ya3MuY29tLyIsInN1YiI6IlVuaXZlcnNhbERpcmVjdG9yeSIsImF1ZCI6Imh0dHA6Ly91bmlkaXIuYXBpLmlnb29kd29ya3MuY29tLyIsImlhdCI6MTc2Mjk5NDUzMSwiZXhwIjoxNzYzMDgwOTMxLCJqdGkiOiJYUUhWWms4ZCIsInBlcm1pc3Npb25zIjpbImNvbXBhbnk6YWRtaW4iLCJjb21wYW55OmRlbGV0ZSIsImNvbXBhbnk6cmVhZCIsImNvbXBhbnk6d3JpdGUiLCJlbWFpbCIsImVtYWlsX3ZlcmlmaWVkIiwiZ3JvdXA6cmVhZCIsIm9wZW5JZCIsInByb2ZpbGUiLCJ1c2VyOmFkbWluIiwidXNlcjpyZWFkIiwidXNlcm5hbWUiXSwicm9sZXMiOltdLCJ0ZW5hbnRfaWQiOiJpZ29vZHdvcmtzIiwiY2xpZW50X2lkIjoiYWRmYWRzdlZFVFZWZGZkZnRWRERTRFZEa2RmZGZuZGYiLCJjb21wYW55SWQiOiJpZ29vZHdvcmtzIiwiZG9tYWluSWQiOiJpZ29vZHdvcmtzLmNvbSIsInRva2VuX3VzZSI6ImFjY2VzcyJ9.T6_T3pPNwj_lO__SNsQs_TMwsvCwNQkCM0xFDfu3__3eH0TRJtK9AMvQWzzyatIktIoeFq9ByjZwkTpubjeGRB8PTDtKDD9NBh5JmsWWgzOYpT_fScPkIKpAKU8PVENsebMXvwIs5CA8Oa0jZDRBFsF0v4S3FzluZVy5z8qSVMLrgYWqldYqf1xSwz8CPBsMSey7qk8e5HsYeTMISDACnkssVUgYdjI5qkqDS8vDW7-af_FZ2uHzaGhwj2HbJl44ug9r_hKYVQVyP1g_7WgK4hNtY2phNocPp1xL-zQGibLnYbR9d8EhesXrac_qfUzeXWyiWzXbDAGGzuhIMT3voQ"
    }
  }'
*/
