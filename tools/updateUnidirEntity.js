import { modifyUnidirData } from "./modifyUnidirData.js";
import { getEntityEndpointAndBaseUrl } from "./unidirEntityHelper.js";

/**
 * Helper to update a specific UniDir entity.
 * Uses method: PUT (can also accept PATCH if specified in args)
 */
export async function updateUnidirEntity(args = {}) {
  const {
    company_id,
    domain_id,
    object_id,
    token,
    entity_type,
    method = "PUT",
    body_json = "{}",
  } = args;

  if (!object_id) {
    return { ok: false, error: "object_id is required for update operation." };
  }

  const { endpoint, currentBaseUrl } = getEntityEndpointAndBaseUrl({
    entity_type,
    company_id,
    domain_id,
    object_id,
  });

  return await modifyUnidirData({
    method,
    token,
    endpoint,
    body_json,
    base_url: currentBaseUrl,
  });
}
