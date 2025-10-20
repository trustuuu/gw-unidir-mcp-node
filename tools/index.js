import { getAccessToken } from "./getAccessToken.js";
import { fetchUnidirData } from "./fetchUnidirData.js";
import { fetchUnidirUser } from "./fetchUnidirUser.js";
import { fetchUnidirGroup } from "./fetchUnidirGroup.js";
import { modifyUnidirData } from "./modifyUnidirData.js";

export const tools = {
  get_access_token: getAccessToken,
  fetch_unidir_data: fetchUnidirData,
  fetch_unidir_user: fetchUnidirUser,
  fetch_unidir_group: fetchUnidirGroup,
  modify_unidir_data: modifyUnidirData,
};
