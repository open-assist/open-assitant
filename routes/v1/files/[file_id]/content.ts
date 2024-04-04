import { FreshContext, Handlers } from "$fresh/server.ts";
import { FileObject } from "@open-schemas/zod/openai";
import { getFile } from "$/routes/v1/files/[file_id].ts";
import { getFileDir } from "$/utils/file.ts";

export const handler: Handlers<FileObject | null> = {
  async GET(_req, ctx: FreshContext) {
    const fileObject = await getFile(ctx);
    const organization = ctx.state.organization as string;
    const dirPath = `${getFileDir()}/${organization}`;
    const file = await Deno.open(`${dirPath}/${fileObject.id}`, { read: true });
    return new Response(file.readable);
  },
};
