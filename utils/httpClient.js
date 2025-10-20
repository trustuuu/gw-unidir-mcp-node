import axios from "axios";

export async function safeApiCall(config) {
  try {
    const resp = await axios(config);
    return { ok: true, data: resp.data };
  } catch (err) {
    const msg =
      err.response?.data?.error_description ||
      err.response?.data?.error ||
      err.message ||
      "Unknown error";
    return { ok: false, error: msg };
  }
}
