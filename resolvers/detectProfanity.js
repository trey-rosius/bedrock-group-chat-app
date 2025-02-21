import { invokeModel } from "@aws-appsync/utils/ai";
import {} from "@aws-appsync/utils";
export function request(ctx) {
  console.log("we're in here");

  return invokeModel({
    modelId: "anthropic.claude-3-5-sonnet-20240620-v1:0",
    guardrailIdentifier: "ur7fovn5gt7r",
    guardrailVersion: "1",
    body: {
      inputText: "Fuck y'all niggas",
    },
  });
}

export function response(ctx) {
  console.log(`bedrock response ${ctx.result}`);
  //return ctx.result.results[0].outputText;
  return "this is the result";
}
