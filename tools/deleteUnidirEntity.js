import { modifyUnidirData } from "./modifyUnidirData.js";
import { getEntityEndpointAndBaseUrl } from "./unidirEntityHelper.js";

/**
 * Helper to delete a specific UniDir entity.
 * Uses method: DELETE
 */
export async function deleteUnidirEntity(args = {}) {
  const { company_id, domain_id, object_id, token, entity_type } = args;

  if (!object_id) {
    return { ok: false, error: "object_id is required for delete operation." };
  }

  const { endpoint, currentBaseUrl } = getEntityEndpointAndBaseUrl({
    entity_type,
    company_id,
    domain_id,
    object_id,
  });

  return await modifyUnidirData({
    method: "DELETE",
    token,
    endpoint,
    base_url: currentBaseUrl,
  });
}
