import { FreshContext, Handlers } from "$fresh/server.ts";
import { z } from "zod";
import { pagableSchema, sortSchema } from "$/repositories/_repository.ts";
import { FileRepository } from "$/repositories/file.ts";
import * as log from "$std/log/mod.ts";
import { ensureDir } from "$/utils/file.ts";
import { getFileDir } from "$/utils/file.ts";
import type { FileObjectType } from "$/schemas/file.ts";
import { UnprocessableContent } from "$/utils/errors.ts";
import { getOrgFilesSizeMax } from "$/utils/file.ts";

export const CreateFileRequest = z.object({
  file: z.object({
    name: z.string(),
    size: z
      .number({
        description: "The size of individual files can be a maximum of 512 MB.",
      })
      .int()
      .min(1)
      .max(512_000_000),
  }),
  purpose: z.enum(["fine-tune", "assistants"]),
});

export const handler: Handlers<FileObjectType | null> = {
  async GET(_req: Request, ctx: FreshContext) {
    const params = Object.fromEntries(ctx.url.searchParams);
    const organization = ctx.state.organization as string;

    const page = await FileRepository.findAllByPage<FileObjectType>(
      organization,
      pagableSchema.parse(params),
      sortSchema.parse(params),
    );

    return Response.json(page);
  },

  async POST(req: Request, ctx: FreshContext) {
    const form = await req.formData();
    const file = form.get("file") as File;
    const fields = CreateFileRequest.parse({
      file: file && {
        name: file.name,
        size: file.size,
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
    const allFileSize = await FileRepository.sumFileSize(organization);
    const max = getOrgFilesSizeMax();
    if (allFileSize + file.size > max) {
      throw new UnprocessableContent(undefined, {
        cause: `The size of all the files uploaded by one organization can be up to ${max} Bytes. Current is ${allFileSize} Bytes.`,
      });
    }

    const { value } = await FileRepository.create<FileObjectType>(
      {
        purpose: fields.purpose,
        bytes: fields.file.size,
        filename: fields.file.name,
      },
      organization,
    );
    log.debug(`value: ${JSON.stringify(value)}`);

    const dirPath = `${getFileDir()}/${organization}`;
    await ensureDir(dirPath);
    Deno.writeFile(`${dirPath}/${value.id}`, file.stream(), {
      create: true,
    });

    return Response.json(value, {
      status: 201,
    });
  },
};
