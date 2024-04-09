import * as log from "$std/log/mod.ts";
import { StepRepository } from "$/repositories/step.ts";
import { RunRepository } from "$/repositories/run.ts";
import { AssistantRepository } from "$/repositories/assistant.ts";
import { MessageRepository } from "$/repositories/message.ts";
import { kv } from "$/repositories/base.ts";
import { getClient } from "$/providers/llm/client.ts";
import {
  FunctionToolCall,
  MessageCreationDetail,
  MessageObject,
  MessageTextContent,
  RunObject,
  StepObject,
  Tool,
  ToolCall,
  ToolCallsDetail,
  Usage,
} from "@open-schemas/zod/openai";
import { now } from "$/utils/date.ts";
import { FileRepository } from "$/repositories/file.ts";

function accumulateUsage(next: Usage, current?: Usage | null): Usage {
  if (current) {
    return {
      prompt_tokens: current.prompt_tokens + next.prompt_tokens,
      completion_tokens: current.completion_tokens + next.completion_tokens,
      total_tokens: current.total_tokens + next.total_tokens,
    };
  }
  return next;
}

function isFunctionToolCall(toolCalls: ToolCall[]) {
  return toolCalls.find((c) => c.type === "function");
}

export class StepJob {
  private static async createMessage(run: RunObject): Promise<MessageObject> {
    return await MessageRepository.getInstance().create(
      {
        role: "assistant",
        status: "in_progress",
        assistant_id: run.assistant_id,
        run_id: run.id,
        thread_id: run.thread_id,
      },
      run.thread_id,
    );
  }

  private static async completeMessage(
    run: RunObject,
    message: MessageObject,
    content: MessageTextContent,
    operation: Deno.AtomicOperation,
  ) {
    return await MessageRepository.getInstance().update(
      message,
      {
        content: [content],
        status: "completed",
        completed_at: now(),
      },
      run.thread_id,
      operation,
    );
  }

  private static async completeStep(
    run: RunObject,
    step: StepObject,
    stepDetails: MessageCreationDetail | ToolCallsDetail,
    usage: Usage,
    operation: Deno.AtomicOperation,
  ) {
    await StepRepository.getInstance().update(
      step,
      {
        type: stepDetails.type,
        step_details: stepDetails,
        status: "completed",
        completed_at: now(),
        usage: usage,
      },
      run.id,
      operation,
    );
  }

  private static async completeRun(
    run: RunObject,
    usage: Usage,
    operation: Deno.AtomicOperation,
    model: string,
    instructions?: string | null,
    tools?: Tool[] | null,
  ) {
    await RunRepository.getInstance().update(
      run,
      {
        status: "completed",
        completed_at: now(),
        usage: accumulateUsage(usage, run.usage),
        model,
        instructions,
        tools,
      },
      run.thread_id,
      operation,
    );
  }

  private static async setRunRequiresAction(
    run: RunObject,
    toolCalls: FunctionToolCall[],
    operation: Deno.AtomicOperation,
  ) {
    await RunRepository.getInstance().update(
      run,
      {
        status: "requires_action",
        required_action: {
          type: "submit_tool_outputs",
          submit_tool_outputs: {
            tool_calls: toolCalls,
          },
        },
      },
      run.thread_id,
      operation,
    );
  }

  public static async execute(stepId: string) {
    const stepRepository = StepRepository.getInstance();
    const step = await stepRepository.findById(stepId);
    if (step.status !== "in_progress") return;

    const runRepository = RunRepository.getInstance();
    const run = await runRepository.findById(step.run_id);

    const assistant = await AssistantRepository.getInstance().findById(run.assistant_id);

    const messageRepository = MessageRepository.getInstance();
    const messages = await messageRepository.findAll(run.thread_id, {
      order: "asc",
    });
    const toolCallSteps = (
      await stepRepository.findAllByThreadId(run.thread_id, {
        order: "asc",
      })
    ).filter(
      (s: StepObject | null) => s && s.step_details && s.step_details.type === "tool_calls",
    ) as StepObject[];

    const model = run.model || assistant.model;
    const instructions = run.instructions || assistant.instructions;
    const tools = run.tools || assistant.tools;
    const files = assistant.file_ids
      ? await FileRepository.getInstance().findByIds(assistant.file_ids)
      : undefined;
    try {
      const Client = await getClient();
      const response = await Client.runStep(
        model,
        messages,
        toolCallSteps,
        instructions,
        tools,
        files,
      );
      log.debug(`[StepJpb] runStep response: ${JSON.stringify(response)}`);
      const { content, tool_calls, usage } = response;

      let stepDetails: ToolCallsDetail | MessageCreationDetail = {} as MessageCreationDetail;
      const operation = kv.atomic();
      if (tool_calls) {
        // tool calls
        if (isFunctionToolCall(tool_calls)) {
          await this.setRunRequiresAction(run, tool_calls as FunctionToolCall[], operation);
        } else {
          tool_calls.forEach((t: ToolCall) => {
            const args = JSON.stringify({ toolCallId: t.id });
            if (t.type === "retrieval") {
              operation.enqueue({ type: "retrieval", args });
            } else if (t.type === "code_interpreter") {
              operation.enqueue({ type: "code_interpreter", args });
            }
          });
        }
        stepDetails = { type: "tool_calls", tool_calls } as ToolCallsDetail;
        await stepRepository.update(
          step,
          {
            type: stepDetails.type,
            step_details: stepDetails,
          },
          run.id,
          operation,
        );
      } else if (content) {
        // message creation
        const message = await this.createMessage(run);
        // complete message
        await this.completeMessage(run, message, content, operation);
        // construct step details
        stepDetails = {
          type: "message_creation",
          message_creation: {
            message_id: message.id,
          },
        } as MessageCreationDetail;
        // complete step
        await this.completeStep(run, step, stepDetails, usage, operation);
        // complete run
        await this.completeRun(run, usage, operation, model, instructions, tools);
      }
      await operation.commit();
    } catch (error) {
      log.error(`[StepJob] ${error}`);
      // TODO: set step and run failed
    }
  }
}
