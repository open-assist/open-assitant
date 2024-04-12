import { FreshContext } from "$fresh/server.ts";
import { DEFAULT_ORGANIZATION } from "$/consts/api.ts";
import { BadRequest, Unauthorized } from "$/utils/errors.ts";
import { State } from "$/routes/_middleware.ts";

export function handler(req: Request, ctx: FreshContext<State>) {
  const token = req.headers.get("X-Assistant-Token");
  if (token && token !== Deno.env.get("INTERNAL_TOKEN")) {
    throw new Unauthorized(undefined, { cause: "Invalid X-Assistant-Token header." });
  }

  let organization = req.headers.get("X-Assistant-Organization");
  if (Deno.env.get("NO_TENANT") === "true") {
    organization = DEFAULT_ORGANIZATION;
  }
  if (!organization) {
    throw new BadRequest(undefined, {
      cause: "Invalid X-Assistant-Organization header.",
    });
  }
  ctx.state.organization = organization;

  return ctx.next();
}
