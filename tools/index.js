import { getAccessToken } from "./getAccessToken.js";
import { fetchUnidirData } from "./fetchUnidirData.js";
import { fetchUnidirUser } from "./fetchUnidirUser.js";
import { fetchUnidirGroup } from "./fetchUnidirGroup.js";
import { modifyUnidirData } from "./modifyUnidirData.js";
import { fetchUnidirCompany } from "./fetchUnidirCompany.js";
import { fetchUnidirDomain } from "./fetchUnidirDomain.js";
import { fetchUnidirApplication } from "./fetchUnidirApplication.js";
import { fetchUnidirApi } from "./fetchUnidirApi.js";

import { createUnidirEntity } from "./createUnidirEntity.js";
import { updateUnidirEntity } from "./updateUnidirEntity.js";
import { deleteUnidirEntity } from "./deleteUnidirEntity.js";

// Helper macro for exporting
const bindEntity = (fn, entity_type) => (args) => fn({ ...args, entity_type });

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

  // User Actions
  create_unidir_user: bindEntity(createUnidirEntity, "users"),
  update_unidir_user: bindEntity(updateUnidirEntity, "users"),
  delete_unidir_user: bindEntity(deleteUnidirEntity, "users"),

  // Group Actions
  create_unidir_group: bindEntity(createUnidirEntity, "groups"),
  update_unidir_group: bindEntity(updateUnidirEntity, "groups"),
  delete_unidir_group: bindEntity(deleteUnidirEntity, "groups"),

  // Company Actions
  create_unidir_company: bindEntity(createUnidirEntity, "companys"),
  update_unidir_company: bindEntity(updateUnidirEntity, "companys"),
  delete_unidir_company: bindEntity(deleteUnidirEntity, "companys"),

  // Domain Actions
  create_unidir_domain: bindEntity(createUnidirEntity, "domainNames"),
  update_unidir_domain: bindEntity(updateUnidirEntity, "domainNames"),
  delete_unidir_domain: bindEntity(deleteUnidirEntity, "domainNames"),

  // Application Actions
  create_unidir_application: bindEntity(createUnidirEntity, "application"),
  update_unidir_application: bindEntity(updateUnidirEntity, "application"),
  delete_unidir_application: bindEntity(deleteUnidirEntity, "application"),

  // API Actions
  create_unidir_api: bindEntity(createUnidirEntity, "api"),
  update_unidir_api: bindEntity(updateUnidirEntity, "api"),
  delete_unidir_api: bindEntity(deleteUnidirEntity, "api"),
};
