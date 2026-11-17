import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { prisma } from "@/server/db";
import { assertSameOrigin, beginAttempt, clientKey, createSession, finishAttempt } from "@/server/auth";
import { env } from "@/server/env";
import { takeChallenge } from "@/server/webauthn";

export async function POST(req: Request) {
  try { await assertSameOrigin(req); } catch (r) { return r as Response; }
  const key = await clientKey();
  const attempt = await beginAttempt(key, { global: false });
  if (attempt.blocked) return Response.json({ error: "Too many attempts. Wait 15 minutes." }, { status: 429 });
  const body = await req.json().catch(() => null);
  const expectedChallenge = await takeChallenge("login");
  if (!body?.id || !expectedChallenge) return Response.json({ error: "Sign-in expired. Try again." }, { status: 400 });
  const pk = await prisma.passkey.findUnique({ where: { id: String(body.id) } });
  if (!pk) {
    return Response.json({ error: "This passkey is not registered." }, { status: 400 });
  }
  try {
    const v = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin: env.appOrigin,
      expectedRPID: env.rpId,
      requireUserVerification: true,
      credential: { id: pk.id, publicKey: new Uint8Array(pk.publicKey), counter: Number(pk.counter), transports: pk.transports as AuthenticatorTransport[] },
    });
    if (!v.verified) throw new Error("Passkey could not be verified.");
    await prisma.passkey.update({ where: { id: pk.id }, data: { counter: BigInt(v.authenticationInfo.newCounter), lastUsedAt: new Date() } });
    await finishAttempt(attempt.id, key, true);
    await createSession(pk.userId, "passkey");
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Passkey could not be verified. Try again or use your password." }, { status: 400 });
  }
}
