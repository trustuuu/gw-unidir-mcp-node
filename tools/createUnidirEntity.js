import { modifyUnidirData } from "./modifyUnidirData.js";
import { getEntityEndpointAndBaseUrl } from "./unidirEntityHelper.js";

/**
 * Helper to create a specific UniDir entity.
 * Uses method: POST
 */
export async function createUnidirEntity(args = {}) {
  const { company_id, domain_id, token, entity_type, body_json = "{}" } = args;

  const { endpoint, currentBaseUrl } = getEntityEndpointAndBaseUrl({
    entity_type,
    company_id,
    domain_id,
  });

  return await modifyUnidirData({
    method: "POST",
    token,
    endpoint,
    body_json,
    base_url: currentBaseUrl,
  });
}
