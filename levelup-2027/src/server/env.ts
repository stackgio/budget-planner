import "server-only";

function req(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (!v) throw new Error(`Missing required environment variable ${name}`);
  return v;
}

export const env = {
  get appOrigin() {
    return req("APP_ORIGIN", "http://localhost:3100").replace(/\/$/, "");
  },
  get rpId() {
    return req("WEBAUTHN_RP_ID", new URL(this.appOrigin).hostname);
  },
  get rpName() {
    return process.env.WEBAUTHN_RP_NAME || "LEVEL UP 2027";
  },
  get secureCookies() {
    return this.appOrigin.startsWith("https://");
  },
  get setupToken() {
    return process.env.SETUP_TOKEN ?? "";
  },
};
