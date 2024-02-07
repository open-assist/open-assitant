import { FreshContext, Handlers } from "$fresh/server.ts";
import { UnprocessableContent } from "$/utils/errors.ts";
import { RunRepository } from "$/repositories/run.ts";
import { getRun } from "$/routes/v1/threads/[thread_id]/runs/[run_id].ts";
import { StepRepository } from "$/repositories/step.ts";
import {
  type RunObjectType,
  type RunStepObjectType,
  SubmitToolOutputsRunRequest,
} from "openai_schemas";

export const handler: Handlers<RunObjectType | null> = {
  async POST(req: Request, ctx: FreshContext) {
    const run = await getRun(ctx);
    if (
      run.status !== "requires_action" ||
      run.required_action?.type !== "submit_tool_outputs"
    ) {
      throw new UnprocessableContent(undefined, {
        cause: "Invalid status or required action of the run.",
      });
    }
    const step = await StepRepository.findOne<RunStepObjectType>(run.id);
    if (!step) {
      throw new UnprocessableContent();
    }
    if (
      step.status !== "in_progress" ||
      step.step_details.type !== "tool_calls"
    ) {
      throw new UnprocessableContent(undefined, {
        cause: "Invalid status or step details of the step.",
      });
    }

    const toolOutpus = SubmitToolOutputsRunRequest.parse(await req.json());

    const newRun = await RunRepository.submitToolOutputs(
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
