import { FreshContext, Handlers } from "$fresh/server.ts";
import { UnprocessableContent } from "$/utils/errors.ts";
import { RunRepository } from "$/repositories/run.ts";
import { getRun } from "$/routes/v1/threads/[thread_id]/runs/[run_id].ts";
import { StepRepository } from "$/repositories/step.ts";
import { RunObject, SubmitToolOutputsToRunRequest } from "@open-schemas/zod/openai";
import { getThread } from "$/routes/v1/threads/[thread_id].ts";

export const handler: Handlers<RunObject | null> = {
  async POST(req: Request, ctx: FreshContext) {
    await getThread(ctx);
    const run = await getRun(ctx);
    if (run.status !== "requires_action" || run.required_action?.type !== "submit_tool_outputs") {
      throw new UnprocessableContent(undefined, {
        cause: "Invalid status or required action of the run.",
      });
    }
    const step = await StepRepository.getInstance().findOne(run.id);
    if (!step) {
      throw new UnprocessableContent();
    }
    if (step.status !== "in_progress" || step.step_details.type !== "tool_calls") {
      throw new UnprocessableContent(undefined, {
        cause: "Invalid status or step details of the step.",
      });
    }

    const toolOutpus = SubmitToolOutputsToRunRequest.parse(await req.json());
    const newRun = await RunRepository.getInstance().submitToolOutputs(
      run,
      step,
      toolOutpus.tool_outputs,
    );

    return Response.json(newRun, {
      status: 202,
      headers: {
        Location: `/threads/${run.thread_id}/runs/${run.id}`,
      },
    });
  },
};
