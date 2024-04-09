import { StepRepository } from "$/repositories/step.ts";
import { FileRepository } from "$/repositories/file.ts";
import { getClient } from "$/providers/retrieval/client.ts";

export class RetrievalJob {
  public static async execute(args: {
    stepId: string;
    toolCallId: string;
    name: string;
    input: string;
    fileIds?: string[];
  }) {
    const { stepId, toolCallId, name, input, fileIds } = args;
    const stepRepository = StepRepository.getInstance();
    let step = await stepRepository.findById(stepId);
    if (step.status !== "in_progress" && step.type !== "tool_calls") return;

    const retrievalClient = getClient();
    const params = JSON.parse(input);
    let output: string | undefined = undefined;
    if (name === "retrieval_open") {
      const { file_id } = params;
      const fileInfo = await FileRepository.getInstance().findInfoById(file_id);
      if (fileInfo) {
        output = await retrievalClient.open(fileInfo.file_path);
      }
    } else if (name === "retrieval_search" && fileIds) {
      const { query } = params;
      const fileInfos = await FileRepository.getInstance().findInfosByIds(fileIds);
      output = await retrievalClient.search(
        query,
        fileInfos.map((i) => i.file_path),
      );
    }

    // double check step
    step = await stepRepository.findById(stepId);
    if (step.status !== "in_progress") return;
    if (step.step_details.type === "tool_calls" && output) {
      const toolCalls = step.step_details.tool_calls.map((call) => {
        if (call.id === toolCallId && call.type === "retrieval") {
          call.retrieval.output = output;
        }
        return call;
      });
      await stepRepository.update(
        step,
        {
          step_details: {
            ...step.step_details,
            tool_calls: toolCalls,
          },
        },
        step.run_id,
      );
      // trigger next step
      // await stepRepository.createWithThread(
      //   {
      //     assistant_id: run.assistant_id,
      //     thread_id: run.thread_id,
      //     run_id: run.id,
      //     status: "in_progress",
      //   },
      //   run.id,
      //   run.thread_id,
      //   operation,
      // );
    }
  }
}
