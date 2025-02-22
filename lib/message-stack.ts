import { Stack, StackProps } from "aws-cdk-lib";
import * as appsync from "aws-cdk-lib/aws-appsync";
import { CfnResolver } from "aws-cdk-lib/aws-appsync";
import { Table } from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";
import * as path from "path";

interface MessageStackProps extends StackProps {
  groupChatGraphqlApi: appsync.GraphqlApi;
  groupChatTable: Table;
  bedrock_datasource: appsync.CfnDataSource;
}

export class MessageStack extends Stack {
  constructor(scope: Construct, id: string, props: MessageStackProps) {
    super(scope, id, props);

    const { groupChatTable, groupChatGraphqlApi, bedrock_datasource } = props;

    const sendMessage = new appsync.AppsyncFunction(this, "sendMessage", {
      name: "sendMessage",
      api: groupChatGraphqlApi,
      dataSource: groupChatGraphqlApi.addDynamoDbDataSource(
        "sendMessage",
        groupChatTable
      ),
      code: appsync.Code.fromAsset(
        path.join(__dirname, "../resolvers/message/sendMessage.js")
      ),
      runtime: appsync.FunctionRuntime.JS_1_0_0,
    });
    const profanity_function = new appsync.CfnFunctionConfiguration(
      this,
      "profanity_function",
      {
        apiId: groupChatGraphqlApi.apiId,
        dataSourceName: bedrock_datasource.name,

        name: "Bedrock_function",
        code: `import { invokeModel } from "@aws-appsync/utils/ai";
        import { runtime } from '@aws-appsync/utils';

export function request(ctx) {
  const input = ctx.args.input;
  const guardrail_id = ctx.env.GUARDRAIL_ID;
  const guardrail_version = ctx.env.GUARDRAIL_VERSION

  console.log(\`guardrail id \${guardrail_id}\`);
  console.log(\`guardrail version \${guardrail_version}\`);

 

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
  console.log(\`bedrock response: \${JSON.stringify(ctx.result)}\`);

  // Extract the response content from the Claude model
  if (ctx.result && ctx.result.content && Array.isArray(ctx.result.content)) {

    if(ctx.result?.["amazon-bedrock-guardrailAction"] === "INTERVENED"){
    const responseText = ctx.result.content.map((item) => item.text).join(" ");
    ctx.args.input.messageText = responseText;
    return ctx.args.input;
    
    }else{
    return ctx.args.input;
    }
      }
    else{

    runtime.earlyReturn({ "message":"something went wrong" })
   
     
  }
}
`,

        runtime: {
          name: "APPSYNC_JS",
          runtimeVersion: "1.0.0",
        },
      }
    );

    const getPostsByCreatorResolver: CfnResolver = new CfnResolver(
      this,
      "getPostsByCreatorResolver",
      {
        apiId: groupChatGraphqlApi.apiId,
        typeName: "Mutation",
        fieldName: "sendMessage",
        kind: "PIPELINE",
        runtime: {
          name: "APPSYNC_JS",
          runtimeVersion: "1.0.0",
        },
        code: `
       export function request(ctx) {
  const { args } = ctx;
  console.log(args);
  return {};
}

// The after step
export function response(ctx) {
  return ctx.prev.result;
}


        `,

        pipelineConfig: {
          functions: [
            profanity_function.attrFunctionId,
            sendMessage.functionId,
          ],
        },
      }
    );
    /*
    new appsync.Resolver(this, "sendMessageResolver", {
      api: groupChatGraphqlApi,
      typeName: "Mutation",
      fieldName: "sendMessage",
      code: appsync.Code.fromAsset(
        path.join(__dirname, "./js_resolvers/_beforeAndAfterMappingTemplate.js")
      ),
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      pipelineConfig: [sendMessage],
    });
    */
  }
}
