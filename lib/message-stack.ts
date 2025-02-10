import { Stack, StackProps } from "aws-cdk-lib";
import * as appsync from "aws-cdk-lib/aws-appsync";
import { Table } from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";
import * as path from "path";

interface MessageStackProps extends StackProps {
  groupChatGraphqlApi: appsync.GraphqlApi;
  groupChatTable: Table;
}

export class MessageStack extends Stack {
  constructor(scope: Construct, id: string, props: MessageStackProps) {
    super(scope, id, props);

    const {
      groupChatTable,
      groupChatGraphqlApi
    } = props;
    const sendMessage = new appsync.AppsyncFunction(this, "sendMessage", {
          name: "sendMessage",
          api: groupChatGraphqlApi,
          dataSource: groupChatGraphqlApi.addDynamoDbDataSource(
            "sendMessage",
            groupChatTable,
          ),
          code: appsync.Code.fromAsset(path.join(__dirname, "../resolvers/sendMessage.js")),
          runtime: appsync.FunctionRuntime.JS_1_0_0,
        },
      );
  
      new appsync.Resolver(this, "sendMessageResolver", {
        api: groupChatGraphqlApi,
        typeName: "Mutation",
        fieldName: "sendMessage",
        code: appsync.Code.fromAsset(
          path.join(__dirname, "./js_resolvers/_beforeAndAfterMappingTemplate.js"),
        ),
        runtime: appsync.FunctionRuntime.JS_1_0_0,
        pipelineConfig: [sendMessage],
      });

    }
  }

