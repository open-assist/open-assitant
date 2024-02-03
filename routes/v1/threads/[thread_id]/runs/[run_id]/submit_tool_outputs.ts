import { FreshContext, Handlers } from "$fresh/server.ts";
import { UnprocessableContent } from "$/utils/errors.ts";
import { type Run, toolOutputsSchema } from "$/schemas/run.ts";
import { type Step } from "$/schemas/step.ts";
import { RunRepository } from "$/repositories/run.ts";
import { getRun } from "../[run_id].ts";
import { StepRepository } from "$/repositories/step.ts";

export const handler: Handlers<Run | null> = {
  async POST(req: Request, ctx: FreshContext) {
    const run = await getRun(ctx);
    if (
      run.status !== "requires_action" ||
      run.required_action?.type !== "submit_tool_outputs"
    ) {
      throw new UnprocessableContent(
        undefined,
        { cause: "Invalid status or required action of the run." },
      );
    }
    const step = await StepRepository.findOne<Step>(run.id);
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

    const toolOutpus = toolOutputsSchema.parse(await req.json());

    const newRun = await RunRepository.submitToolOutputs(
      run,
      step,
      toolOutpus.tool_outputs,
    );

    return Response.json(newRun, {
      status: 202,
      headers: {
        "Location": `/threads/${run.thread_id}/runs/${run.id}`,
      },
    });
  },
};
