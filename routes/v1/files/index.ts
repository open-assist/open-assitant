import { FreshContext, Handlers } from "$fresh/server.ts";
import { FileObject, UploadFileRequest } from "@open-schemas/zod/openai";
import { FileRepository } from "$/repositories/file.ts";
import * as log from "$std/log/mod.ts";
import { getOrgFilesSizeMax } from "$/utils/file.ts";
import { UnprocessableContent } from "$/utils/errors.ts";

export const handler: Handlers<FileObject | null> = {
  async GET(_req: Request, ctx: FreshContext) {
    const params = Object.fromEntries(ctx.url.searchParams);
    const organization = ctx.state.organization as string;

    const data = await FileRepository.getInstance().findByPurpose(organization, params["purpose"]);

    return Response.json({ object: "list", data });
  },

  async POST(req: Request, ctx: FreshContext) {
    const form = await req.formData();
    const file = form.get("file") as File;
    const fields = UploadFileRequest.parse({
      file: file && {
        name: file.name,
        size: file.size,
        type: file.type,
      },
      purpose: form.get("purpose") as string,
    });
    log.debug(`fields: ${JSON.stringify(fields)}`);
    if (fields.purpose === "fine-tune" && !file.name.endsWith(".jsonl")) {
      throw new UnprocessableContent(undefined, {
        cause: "The Fine-tuning API only supports .jsonl files.",
      });
    }
    const organization = ctx.state.organization as string;
    const fileRepository = FileRepository.getInstance();
    const allFileSize = await fileRepository.sumFileSize(organization);
    const max = getOrgFilesSizeMax();
    if (allFileSize + file.size > max) {
      throw new UnprocessableContent(undefined, {
        cause: `The size of all the files uploaded by one organization can be up to ${max} Bytes. Current is ${allFileSize} Bytes.`,
      });
    }

    const fileObject = await fileRepository.createWithFile(
      {
        purpose: fields.purpose,
        bytes: fields.file.size,
        filename: fields.file.name,
      },
      organization,
      file,
    );
    log.debug(`value: ${JSON.stringify(fileObject)}`);

    return Response.json(fileObject, {
      status: 201,
    });
  },
};
