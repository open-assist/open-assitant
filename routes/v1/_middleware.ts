import { FreshContext } from "$fresh/server.ts";
import { DEFAULT_ORGANIZATION } from "$/consts/api.ts";
import { NO_TENANT } from "$/consts/envs.ts";
import { Unauthorized } from "$/utils/errors.ts";
import { State } from "$/routes/_middleware.ts";
import { TokenRepository } from "$/repositories/token.ts";

export async function handler(req: Request, ctx: FreshContext<State>) {
  if (Deno.env.get(NO_TENANT) === "true") {
    ctx.state.organization = DEFAULT_ORGANIZATION;
  } else {
    const unauthorized = new Unauthorized(undefined, { cause: "Bad credentials." });
    const authorization = req.headers.get("Authorization");
    if (!authorization) {
      throw unauthorized;
    }
    const [type, token] = authorization.split(" ");
    if (!type || !token || type.toLowerCase() !== "bearer") {
      throw unauthorized;
    }

    const result = await TokenRepository.findOrgByToken(token);
    if (!result.value) throw unauthorized;
    ctx.state.organization = result.value;
  }

  return ctx.next();
}
