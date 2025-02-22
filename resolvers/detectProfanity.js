import { invokeModel } from "@aws-appsync/utils/ai";
import { runtime } from "@aws-appsync/utils";

export function request(ctx) {
  const input = ctx.args.input;
  const guardrail_id = ctx.env.GUARDRAIL_ID;
  const guardrail_version = ctx.env.GUARDRAIL_VERSION;

  return invokeModel({
    modelId: "anthropic.claude-3-5-sonnet-20240620-v1:0",
    guardrailIdentifier: guardrail_id,
    guardrailVersion: guardrail_version,
    body: {
      messages: [
        {
          role: "user",
          content: input.messageText, // Pass the moderation prompt to the model
        },
      ],
      max_tokens: 100,
      temperature: 0.5,
      anthropic_version: "bedrock-2023-05-31",
    },
  });
}

export function response(ctx) {
  // Extract the response content from the Claude model
  if (ctx.result && ctx.result.content && Array.isArray(ctx.result.content)) {
    if (ctx.result?.["amazon-bedrock-guardrailAction"] === "INTERVENED") {
      const responseText = ctx.result.content
        .map((item) => item.text)
        .join(" ");
      ctx.args.input.messageText = responseText;
      return ctx.args.input;
    } else {
      return ctx.args.input;
    }
  } else {
    runtime.earlyReturn({ message: "something went wrong" });
  }
}
