import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { prisma } from "@/server/db";
import { assertSameOrigin, clientKey, createSession, loginBlocked, recordAttempt } from "@/server/auth";
import { env } from "@/server/env";
import { takeChallenge } from "@/server/webauthn";

export async function POST(req: Request) {
  try { await assertSameOrigin(req); } catch (r) { return r as Response; }
  const key = await clientKey();
  if (await loginBlocked(key)) return Response.json({ error: "Too many attempts. Wait 15 minutes." }, { status: 429 });
  const body = await req.json().catch(() => null);
  const expectedChallenge = await takeChallenge("login");
  if (!body?.id || !expectedChallenge) return Response.json({ error: "Sign-in expired. Try again." }, { status: 400 });
  const pk = await prisma.passkey.findUnique({ where: { id: String(body.id) } });
  if (!pk) {
    await recordAttempt(key, false);
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
    await recordAttempt(key, true);
    await createSession(pk.userId, "passkey");
    return Response.json({ ok: true });
  } catch (e) {
    await recordAttempt(key, false);
    return Response.json({ error: e instanceof Error ? e.message : "Verification failed." }, { status: 400 });
  }
}
