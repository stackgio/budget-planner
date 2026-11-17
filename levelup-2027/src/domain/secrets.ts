/** Secret generation with the platform's secure random generator (browser or Node WebCrypto). Pure, no I/O. */
export const b64url = (b: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
export const randomString = (bytes: number) => b64url(crypto.getRandomValues(new Uint8Array(bytes)));

export interface GeneratedSecret { name: string; value: string; note: string }

export async function generateLaunchSecrets(): Promise<GeneratedSecret[]> {
  const kp = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
  const pub = await crypto.subtle.exportKey("raw", kp.publicKey);
  const jwk = await crypto.subtle.exportKey("jwk", kp.privateKey);
  return [
    { name: "DATA_ENCRYPTION_KEY", value: randomString(48), note: "Locks your private notes. Save it — it can't be recovered." },
    { name: "BACKUP_PASSPHRASE", value: randomString(32), note: "Opens your backup files. Save it separately." },
    { name: "SETUP_TOKEN", value: randomString(24), note: "Used once to create your account (and for disaster restore)." },
    { name: "VAPID_PUBLIC_KEY", value: b64url(pub), note: "Push notifications (public half)." },
    { name: "VAPID_PRIVATE_KEY", value: jwk.d!, note: "Push notifications (private half)." },
  ];
}
