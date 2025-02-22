import { Stack, StackProps } from "aws-cdk-lib";
import * as appsync from "aws-cdk-lib/aws-appsync";
import * as iam from "aws-cdk-lib/aws-iam";
import { Table } from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";
import * as path from "path";
import { CfnResolver } from "aws-cdk-lib/aws-appsync";
interface GroupStackProps extends StackProps {
  groupChatGraphqlApi: appsync.GraphqlApi;
  groupChatTable: Table;
}

export class GroupStacks extends Stack {
  constructor(scope: Construct, id: string, props: GroupStackProps) {
    super(scope, id, props);

    const { groupChatTable, groupChatGraphqlApi } = props;

    const groupDataSource = groupChatGraphqlApi.addDynamoDbDataSource(
      "GroupDataSource",
      groupChatTable
    );
    const createGroupFunction = new appsync.AppsyncFunction(
      this,
      "createGroupFunction",
      {
        name: "createGroupFunction",
        api: groupChatGraphqlApi,
        dataSource: groupDataSource,
        code: appsync.Code.fromAsset(
          path.join(__dirname, "../resolvers/group/createGroup.js")
        ),
        runtime: appsync.FunctionRuntime.JS_1_0_0,
      }
    );
    const bedrockDataSource = groupChatGraphqlApi.addHttpDataSource(
      "bedrockDS",
      "https://bedrock-runtime.us-east-1.amazonaws.com",
      {
        authorizationConfig: {
          signingRegion: "us-east-1",
          signingServiceName: "bedrock",
        },
      }
    );

    bedrockDataSource.grantPrincipal.addToPrincipalPolicy(
      new iam.PolicyStatement({
        resources: [
          "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-5-sonnet-20240620-v1:0",
        ],
        actions: ["bedrock:InvokeModel"],
      })
    );

    new appsync.Resolver(this, "createGroupResolver", {
      api: groupChatGraphqlApi,
      typeName: "Mutation",
      fieldName: "createGroup",
      code: appsync.Code.fromAsset(
        path.join(__dirname, "./js_resolvers/_beforeAndAfterMappingTemplate.js")
      ),
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      pipelineConfig: [createGroupFunction],
    });

    const addUserToGroup = new appsync.AppsyncFunction(this, "addUserToGroup", {
      name: "addUserToGroup",
      api: groupChatGraphqlApi,
      dataSource: groupDataSource,
      code: appsync.Code.fromAsset(
        path.join(__dirname, "../resolvers/group/addUserToGroup.js")
      ),
      runtime: appsync.FunctionRuntime.JS_1_0_0,
    });

    new appsync.Resolver(this, "addUserToGroupResolver", {
      api: groupChatGraphqlApi,
      typeName: "Mutation",
      fieldName: "addUserToGroup",
      code: appsync.Code.fromAsset(
        path.join(__dirname, "./js_resolvers/_beforeAndAfterMappingTemplate.js")
      ),
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      pipelineConfig: [addUserToGroup],
    });

    const getAllUsersPerGroup = new appsync.AppsyncFunction(
      this,
      "getAllUsersPerGroup",
      {
        name: "getAllUsersPerGroup",
        api: groupChatGraphqlApi,
        dataSource: groupDataSource,
        code: appsync.Code.fromAsset(
          path.join(__dirname, "../resolvers/group/getAllUsersPerGroup.js")
        ),
        runtime: appsync.FunctionRuntime.JS_1_0_0,
      }
    );

    new appsync.Resolver(this, "getAllUsersPerGroupResolver", {
      api: groupChatGraphqlApi,
      typeName: "Query",
      fieldName: "getAllUsersPerGroup",
      code: appsync.Code.fromAsset(
        path.join(__dirname, "./js_resolvers/_beforeAndAfterMappingTemplate.js")
      ),
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      pipelineConfig: [getAllUsersPerGroup],
    });

    const getAllGroupsCreatedByUser = new appsync.AppsyncFunction(
      this,
      "getAllGroupsCreatedByUser",
      {
        name: "getAllGroupsCreatedByUser",
        api: groupChatGraphqlApi,
        dataSource: groupDataSource,
        code: appsync.Code.fromAsset(
          path.join(
            __dirname,
            "../resolvers/group/getAllGroupsCreatedByUser.js"
          )
        ),
        runtime: appsync.FunctionRuntime.JS_1_0_0,
      }
    );

    new appsync.Resolver(this, "getAllGroupsCreatedByUserResolver", {
      api: groupChatGraphqlApi,
      typeName: "Query",
      fieldName: "getAllGroupsCreatedByUser",
      code: appsync.Code.fromAsset(
        path.join(__dirname, "./js_resolvers/_beforeAndAfterMappingTemplate.js")
      ),
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      pipelineConfig: [getAllGroupsCreatedByUser],
    });

    const getAllMessagesPerGroup = new appsync.AppsyncFunction(
      this,
      "getAllMessagesPerGroup",
      {
        name: "getAllMessagesPerGroup",
        api: groupChatGraphqlApi,
        dataSource: groupDataSource,
        code: appsync.Code.fromAsset(
          path.join(__dirname, "../resolvers/group/getAllMessagesPerGroup.js")
        ),
        runtime: appsync.FunctionRuntime.JS_1_0_0,
      }
    );

    new appsync.Resolver(this, "getAllMessagesPerGroupResolver", {
      api: groupChatGraphqlApi,
      typeName: "Query",
      fieldName: "getAllMessagesPerGroup",
      code: appsync.Code.fromAsset(
        path.join(__dirname, "./js_resolvers/_beforeAndAfterMappingTemplate.js")
      ),
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      pipelineConfig: [getAllMessagesPerGroup],
    });

    const getGroupsUserBelongsTo = new appsync.AppsyncFunction(
      this,
      "getGroupsUserBelongsTo",
      {
        name: "getGroupsUserBelongsTo",
        api: groupChatGraphqlApi,
        dataSource: groupDataSource,
        code: appsync.Code.fromAsset(
          path.join(__dirname, "../resolvers/group/getGroupsUserBelongsTo.js")
        ),
        runtime: appsync.FunctionRuntime.JS_1_0_0,
      }
    );

    new appsync.Resolver(this, "getGroupsUserBelongsToResolver", {
      api: groupChatGraphqlApi,
      typeName: "Query",
      fieldName: "getGroupsUserBelongsTo",
      code: appsync.Code.fromAsset(
        path.join(__dirname, "./js_resolvers/_beforeAndAfterMappingTemplate.js")
      ),
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      pipelineConfig: [getGroupsUserBelongsTo],
    });

    groupChatGraphqlApi
      .addDynamoDbDataSource("getMessageUser", groupChatTable)
      .createResolver("userResolver", {
        typeName: "Message",
        fieldName: "user",
        code: appsync.Code.fromAsset(
          path.join(__dirname, "../resolvers/group/getMessageUser.js")
        ),
        runtime: appsync.FunctionRuntime.JS_1_0_0,
      });

    groupChatGraphqlApi
      .addDynamoDbDataSource("getUserGroup", groupChatTable)
      .createResolver("userGroupResolver", {
        typeName: "UserGroup",
        fieldName: "groups",
        code: appsync.Code.fromAsset(
          path.join(__dirname, "../resolvers/group/getUserGroup.js")
        ),
        runtime: appsync.FunctionRuntime.JS_1_0_0,
      });

    groupChatGraphqlApi
      .addDynamoDbDataSource("getGroupUser", groupChatTable)
      .createResolver("groupUserResolver", {
        typeName: "GroupUser",
        fieldName: "user",
        code: appsync.Code.fromAsset(
          path.join(__dirname, "../resolvers/group/getGroupUser.js")
        ),
        runtime: appsync.FunctionRuntime.JS_1_0_0,
      });
  }
}
