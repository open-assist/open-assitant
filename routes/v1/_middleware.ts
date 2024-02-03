import { FreshContext } from "$fresh/server.ts";
import { Unauthorized } from "$/utils/errors.ts";
import { State } from "$/routes/_middleware.ts";
import { TokenRepository } from "$/repositories/token.ts";

export async function handler(
  req: Request,
  ctx: FreshContext<State>,
) {
  const authorization = req.headers.get("Authorization");
  if (!authorization) {
    throw new Unauthorized("Missing authorization header.");
  }
  const [type, token] = authorization.split(" ");
  if (!type || !token || type.toLowerCase() !== "bearer") {
    throw new Unauthorized("Invalid authorization format.");
  }

  const result = await TokenRepository.findOrgByToken(token);
  if (!result.value) throw new Unauthorized("Invalid token.");
  ctx.state.organization = result.value;

  return ctx.next();
}
