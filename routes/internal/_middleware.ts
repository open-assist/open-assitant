import { FreshContext } from "$fresh/server.ts";
import { BadRequest, Unauthorized } from "$/utils/errors.ts";
import { State } from "$/routes/_middleware.ts";

export function handler(req: Request, ctx: FreshContext<State>) {
  const token = req.headers.get("X-Assist-Token");
  if (token && token !== Deno.env.get("INTERNAL_TOKEN")) {
    throw new Unauthorized(undefined, { cause: "Invalid internal token." });
  }

  let organization = req.headers.get("X-Assist-Org-Id");
  if (Deno.env.get("NO_TENANT") === "true") {
    organization = "#org";
  }
  if (!organization) {
    throw new BadRequest(undefined, {
      cause: "Missing X-Assist-Org-Id header.",
    });
  }
  ctx.state.organization = organization;

  return ctx.next();
}
