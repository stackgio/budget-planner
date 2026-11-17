import "server-only";

/**
 * Push delivery abstraction. LEVEL UP never needs a paid service for this:
 * Web Push goes through the browser vendor's free push service (Apple's for iPhone).
 * - NoopPushSender: used when VAPID keys aren't configured (local development) — in-app only.
 * - WebPushSender: real delivery, used only when VAPID keys are set (after an approved deployment).
 * - Tests inject their own sender.
 */
export interface PushTarget { endpoint: string; p256dh: string; auth: string }
export type PushResult = { ok: true } | { ok: false; gone: boolean; error: string } | { ok: false; skipped: true; error: string };
export interface PushSender { readonly name: string; readonly enabled: boolean; send(target: PushTarget, payload: { title: string; body: string; url: string; tag: string }): Promise<PushResult> }

export class NoopPushSender implements PushSender {
  readonly name = "noop";
  readonly enabled = false;
  async send(): Promise<PushResult> {
    return { ok: false, skipped: true, error: "Push is not configured on this server (in-app notifications still work)." };
  }
}

export function vapidPublicKey(): string | null {
  return process.env.VAPID_PUBLIC_KEY || null;
}

export class WebPushSender implements PushSender {
  readonly name = "web-push";
  readonly enabled = true;
  constructor(private readonly subject: string, private readonly publicKey: string, private readonly privateKey: string) {}
  async send(target: PushTarget, payload: { title: string; body: string; url: string; tag: string }): Promise<PushResult> {
    const webpush = (await import("web-push")).default;
    try {
      await webpush.sendNotification(
        { endpoint: target.endpoint, keys: { p256dh: target.p256dh, auth: target.auth } },
        JSON.stringify(payload),
        { vapidDetails: { subject: this.subject, publicKey: this.publicKey, privateKey: this.privateKey }, TTL: 60 * 60, urgency: "normal" },
      );
      return { ok: true };
    } catch (e) {
      const status = (e as { statusCode?: number }).statusCode ?? 0;
      return { ok: false, gone: status === 404 || status === 410, error: `push failed (${status || "network"})` };
    }
  }
}

export function defaultPushSender(): PushSender {
  const pub = process.env.VAPID_PUBLIC_KEY, priv = process.env.VAPID_PRIVATE_KEY, subject = process.env.VAPID_SUBJECT;
  return pub && priv && subject ? new WebPushSender(subject, pub, priv) : new NoopPushSender();
}
