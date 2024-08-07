import { FreshContext } from "$fresh/server.ts";
import {
  BadRequest,
  DbCommitError,
  InternalServerError,
  NotFound,
  ProblemDetail,
  Unauthorized,
  UnprocessableContent,
} from "$/utils/errors.ts";
import { ZodError } from "zod";
import * as log from "$std/log/mod.ts";
import { Conflict } from "$/utils/errors.ts";

export interface State {
  organization: string;
}

export function handler(req: Request, ctx: FreshContext) {
  const headers: [string, string][] = [
    ["Access-Control-Allow-Origin", req.headers.get("Origin") || "*"],
    ["Access-Control-Allow-Credentials", "true"],
    ["Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS"],
  ];

  if (req.method == "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers,
    });
  }

  return ctx
    .next()
    .catch((error: Error) => {
      const problemDetail: ProblemDetail = {
        type: "about:blank",
        status: 500,
        title: error.message,
        detail: error.cause as string,
      };

      switch (error.constructor) {
        case SyntaxError:
        case BadRequest:
          problemDetail.status = 400;
          break;
        case Unauthorized:
          problemDetail.status = 401;
          break;
        case NotFound:
          problemDetail.status = 404;
          problemDetail.instance = (error as NotFound).instance;
          break;
        case Conflict:
          problemDetail.status = 409;
          break;
        case ZodError:
          problemDetail.status = 422;
          problemDetail.title = "Unprocessable Content";
          problemDetail.errors = (error as ZodError).issues;
          break;
        case UnprocessableContent:
          problemDetail.status = 422;
          problemDetail.errors = (error as UnprocessableContent).errors;
          break;
        case DbCommitError:
        case InternalServerError:
          problemDetail.status = 500;
          log.error(error);
          break;
      }

      return Response.json(problemDetail, {
        status: problemDetail.status,
      });
    })
    .then((resp) => {
      for (const header of headers) {
        resp.headers.set(header[0], header[1]);
      }
      return resp;
    });
}
