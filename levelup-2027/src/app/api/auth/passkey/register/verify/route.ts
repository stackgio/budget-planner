import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { prisma } from "@/server/db";
import { assertSameOrigin, getCurrentUser } from "@/server/auth";
import { env } from "@/server/env";
import { takeChallenge } from "@/server/webauthn";

export async function POST(req: Request) {
  try { await assertSameOrigin(req); } catch (r) { return r as Response; }
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const expectedChallenge = await takeChallenge("register", user.id);
  if (!body?.response || !expectedChallenge) return Response.json({ error: "Registration expired. Try again." }, { status: 400 });
  try {
    const v = await verifyRegistrationResponse({
      response: body.response,
      expectedChallenge,
      expectedOrigin: env.appOrigin,
      expectedRPID: env.rpId,
      requireUserVerification: true,
    });
    if (!v.verified || !v.registrationInfo) return Response.json({ error: "Could not verify passkey." }, { status: 400 });
    const { credential, credentialDeviceType, credentialBackedUp } = v.registrationInfo;
    const label = String(body.label ?? "").trim().slice(0, 40) || "Passkey";
    await prisma.passkey.create({
      data: {
        id: credential.id,
        userId: user.id,
        publicKey: Buffer.from(credential.publicKey),
        counter: BigInt(credential.counter),
        transports: credential.transports ?? [],
        deviceType: credentialDeviceType,
        backedUp: credentialBackedUp,
        label,
      },
    });
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Verification failed." }, { status: 400 });
  }
}
