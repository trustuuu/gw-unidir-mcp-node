import { getAccessToken } from "./getAccessToken.js";
import { fetchUnidirData } from "./fetchUnidirData.js";
import { fetchUnidirUser } from "./fetchUnidirUser.js";
import { fetchUnidirGroup } from "./fetchUnidirGroup.js";
import { modifyUnidirData } from "./modifyUnidirData.js";
import { fetchUnidirCompany } from "./fetchUnidirCompany.js";
import { fetchUnidirDomain } from "./fetchUnidirDomain.js";
import { fetchUnidirApplication } from "./fetchUnidirApplication.js";
import { fetchUnidirApi } from "./fetchUnidirApi.js";

export const tools = {
  get_access_token: getAccessToken,
  fetch_unidir_data: fetchUnidirData,
  fetch_unidir_user: fetchUnidirUser,
  fetch_unidir_group: fetchUnidirGroup,
  fetch_unidir_company: fetchUnidirCompany,
  fetch_unidir_domain: fetchUnidirDomain,
  fetch_unidir_application: fetchUnidirApplication,
  fetch_unidir_api: fetchUnidirApi,
  modify_unidir_data: modifyUnidirData,
};
