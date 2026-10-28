import { json } from "../_mocks.js";

export async function onRequestGet(context) {
  const req = context.request;
  const forwarded =
    req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for");
  let ip = "";
  if (forwarded) {
    ip = forwarded.split(",")[0].trim();
  }
  if (!ip || ip === "127.0.0.1" || ip === "::1") {
    ip = "83.54.120.45";
  }
  return json({ ip });
}
