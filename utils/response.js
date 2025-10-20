export function success(data) {
  return {
    ok: true,
    result: { type: "text", text: JSON.stringify(data, null, 2) },
  };
}

export function error(message) {
  return { ok: false, result: { type: "text", text: `${message}` } };
}
