import { StepRepository } from "$/repositories/step.ts";
import type {
  AssistantObjectType,
  MessageContentTextObjectType,
  MessageObjectType,
  RunObjectType,
  RunStepDetailsToolCallsFunctionObjectType,
  RunStepDetailsToolCallsObjectType,
  RunStepObjectType,
} from "openai_schemas";
import { RunRepository } from "$/repositories/run.ts";
import { AssistantRepository } from "$/repositories/assistant.ts";
import { MessageRepository } from "$/repositories/message.ts";
import { Gemini } from "$/vendors/google/gemini.ts";
import { RunStepDetailsMessagesObjectType } from "$/vendors/google/schemas.ts";
import { RateLimitExceeded } from "$/utils/errors.ts";
import { ServerError } from "$/utils/errors.ts";
import { DbCommitError } from "$/utils/errors.ts";

export interface StepJobMessage {
  stepId: string;
}

export function isStepJobMessage(message: unknown) {
  return (message as StepJobMessage).stepId !== undefined;
}

export class StepJob {
  public static async execute(message: StepJobMessage) {
    const step = await StepRepository.findById<RunStepObjectType>(
      message.stepId,
    );
    if (step.status !== "in_progress") return;

    const run = await RunRepository.findById<RunObjectType>(step.run_id);
    const assistant = await AssistantRepository.findById<AssistantObjectType>(
      run.assistant_id,
    );
    const messages = await MessageRepository.findAll<MessageObjectType>(
      run.thread_id,
      { order: "asc" },
    );
    const allSteps = await StepRepository.findAllByThreadId(run.thread_id, {
      order: "asc",
    });

    try {
      const stepDetails = await Gemini.generateContent(
        run.model || assistant.model,
        messages,
        allSteps.slice(0, -1),
        run.instructions || assistant.instructions,
        assistant.tools,
      );
      stepDetails.forEach(async (detail) => {
        if (detail.type === "messages") {
          await this._create_message(
            run,
            step,
            (detail as RunStepDetailsMessagesObjectType)
              .messages as MessageContentTextObjectType[],
          );
        } else if (detail.type === "tool_calls") {
          await this._call_function_tool(
            run,
            step,
            (detail as RunStepDetailsToolCallsObjectType)
              .tool_calls as RunStepDetailsToolCallsFunctionObjectType[],
          );
        }
      });
    } catch (error) {
      console.log("[step job]", error);
      // status: in_progress -> failed
      const lastError = {
        code: "server_error",
        message: "Please try again, after the server has recovered.",
      };
      switch (error.constructor) {
        case RateLimitExceeded:
          (lastError.code = "rate_limit_exceeded"),
            (lastError.message =
              "You exceeded your current quota, please check your plan and billing details.");
          break;
        case ServerError:
        default:
          break;
      }

      const statusFields = {
        last_error: lastError,
        status: "failed",
        failed_at: Date.now(),
      };
      const { operation } =
        StepRepository.updateWithoutCommit<RunStepObjectType>(
          step,
          statusFields as Partial<RunStepObjectType>,
        );
      operation.set(RunRepository.genKvKey(run.thread_id, run.id), {
        ...run,
        ...statusFields,
      });

      const { ok } = await operation.commit();
      if (!ok) throw new DbCommitError();
    }
  }

  private static async _create_message(
    run: RunObjectType,
    step: RunStepObjectType,
    content: MessageContentTextObjectType[],
  ) {
    // create message
    const { operation, value: message } =
      MessageRepository.createWithoutCommit<MessageObjectType>(
        {
          thread_id: run.thread_id,
          assistant_id: run.assistant_id,
          run_id: run.id,
          role: "assistant",
          content,
        },
        run.thread_id,
      );

    const stepType = "message_creation";
    // status: in_progress -> completed
    const statusFields = {
      status: "completed",
      completed_at: Date.now(),
    };
    const stepKey = StepRepository.genKvKey(run.id, step.id);
    const runKey = RunRepository.genKvKey(run.thread_id, run.id);
    await operation
      .set(stepKey, {
        ...step,
        ...statusFields,
        type: stepType,
        step_details: {
          type: stepType,
          message_creation: {
            message_id: message.id,
          },
        },
      })
      .set(runKey, {
        ...run,
        ...statusFields,
      })
      .commit();
  }

  private static async _call_function_tool(
    run: RunObjectType,
    step: RunStepObjectType,
    functionToolCalls: RunStepDetailsToolCallsFunctionObjectType[],
  ) {
    const stepType = "tool_calls";
    const { operation } = RunRepository.updateWithoutCommit<RunObjectType>(
      run,
      {
        status: "requires_action",
        required_action: {
          type: "submit_tool_outputs",
          submit_tool_outputs: {
            tool_calls: functionToolCalls,
          },
        },
      },
      run.thread_id,
    );

    StepRepository.updateWithoutCommit<RunStepObjectType>(
      step,
      {
        type: stepType,
        step_details: {
          type: stepType,
          tool_calls: functionToolCalls,
        },
      },
      run.id,
      operation,
    );

    await operation.commit();
  }
}
