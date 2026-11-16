import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { assertSameOrigin } from "@/server/auth";
import { env } from "@/server/env";
import { storeChallenge } from "@/server/webauthn";

export async function POST(req: Request) {
  try { await assertSameOrigin(req); } catch (r) { return r as Response; }
  const options = await generateAuthenticationOptions({ rpID: env.rpId, userVerification: "required" });
  await storeChallenge(options.challenge, "login");
  return Response.json(options);
}
