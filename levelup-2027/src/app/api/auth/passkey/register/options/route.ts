import { generateRegistrationOptions } from "@simplewebauthn/server";
import { prisma } from "@/server/db";
import { assertSameOrigin, getCurrentUser } from "@/server/auth";
import { env } from "@/server/env";
import { storeChallenge } from "@/server/webauthn";

export async function POST(req: Request) {
  try { await assertSameOrigin(req); } catch (r) { return r as Response; }
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const existing = await prisma.passkey.findMany({ where: { userId: user.id } });
  const options = await generateRegistrationOptions({
    rpName: env.rpName,
    rpID: env.rpId,
    userName: user.email,
    userDisplayName: user.displayName,
    userID: new TextEncoder().encode(user.id),
    attestationType: "none",
    excludeCredentials: existing.map((p) => ({ id: p.id, transports: p.transports as AuthenticatorTransport[] })),
    authenticatorSelection: { residentKey: "required", userVerification: "required" },
  });
  await storeChallenge(options.challenge, "register", user.id);
  return Response.json(options);
}
