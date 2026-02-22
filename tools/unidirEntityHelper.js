import { baseUrl, baseUrlAuth } from "../utils/constants.js";

/**
 * Helper to construct the correct endpoint and base URL based on entity type.
 */
export function getEntityEndpointAndBaseUrl(args) {
  const { entity_type, company_id, domain_id, object_id } = args;

  let endpoint = "";
  let currentBaseUrl = baseUrl;

  if (entity_type === "users") {
    endpoint = `/companys/${company_id}/domainNames/${domain_id}/users`;
  } else if (entity_type === "groups") {
    endpoint = `/companys/${company_id}/domainNames/${domain_id}/groups`;
  } else if (entity_type === "companys" || entity_type === "company") {
    endpoint = `/companys`;
  } else if (
    entity_type === "domainNames" ||
    entity_type === "domains" ||
    entity_type === "domain"
  ) {
    endpoint = `/companys/${company_id}/domainNames`;
  } else if (entity_type === "application" || entity_type === "applications") {
    endpoint = `/${company_id}/${domain_id}/application`;
    currentBaseUrl = baseUrlAuth;
  } else if (entity_type === "api" || entity_type === "apis") {
    endpoint = `/${company_id}/${domain_id}/api`;
    currentBaseUrl = baseUrlAuth;
  } else {
    // Default fallback
    endpoint = `/companys/${company_id}/domainNames/${domain_id}/${entity_type}`;
  }

  if (object_id) {
    endpoint += `/${object_id}`;
  }

  return { endpoint, currentBaseUrl };
}
