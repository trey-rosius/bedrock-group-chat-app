import { Stack, StackProps } from "aws-cdk-lib";
import * as appsync from "aws-cdk-lib/aws-appsync";
import * as signer from "aws-cdk-lib/aws-signer";
import { Table } from "aws-cdk-lib/aws-dynamodb";
import { ManagedPolicy, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import * as path from "path";
interface GroupStackProps extends StackProps {
  groupChatGraphqlApi: appsync.GraphqlApi;
  //   apiSchema: appsync.CfnGraphQLSchema;
  groupChatTable: Table;
  //   groupChatDatasource: appsync.DynamoDbDataSource;
}

export class GroupStacks extends Stack {
  constructor(scope: Construct, id: string, props: GroupStackProps) {
    super(scope, id, props);

    const {
      groupChatTable,
      groupChatGraphqlApi,
      //   apiSchema,
      //   groupChatDatasource,
    } = props;

    const createGroupFunction = new appsync.AppsyncFunction(
      this,
      "createGroupFunction",
      {
        name: "createGroupFunction",
        api: groupChatGraphqlApi,
        dataSource: groupChatGraphqlApi.addDynamoDbDataSource(
          "createGroupFunction",
          groupChatTable
        ),
        code: appsync.Code.fromAsset(
          path.join(__dirname, "../resolvers/createGroupResolver.js")
        ),
        runtime: appsync.FunctionRuntime.JS_1_0_0,
      }
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
      dataSource: groupChatGraphqlApi.addDynamoDbDataSource(
        "addUserToGroup",
        groupChatTable
      ),
      code: appsync.Code.fromAsset(
        path.join(__dirname, "../resolvers/addUserToGroup.js")
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
        dataSource: groupChatGraphqlApi.addDynamoDbDataSource(
          "getAllUsersPerGroup",
          groupChatTable
        ),
        code: appsync.Code.fromAsset(
          path.join(__dirname, "../resolvers/getAllUsersPerGroup.js")
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
        dataSource: groupChatGraphqlApi.addDynamoDbDataSource(
          "getAllGroupsCreatedByUser",
          groupChatTable
        ),
        code: appsync.Code.fromAsset(
          path.join(__dirname, "../resolvers/getAllGroupsCreatedByUser.js")
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
        dataSource: groupChatGraphqlApi.addDynamoDbDataSource(
          "getAllMessagesPerGroup",
          groupChatTable
        ),
        code: appsync.Code.fromAsset(
          path.join(__dirname, "../resolvers/getAllMessagesPerGroup.js")
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
        dataSource: groupChatGraphqlApi.addDynamoDbDataSource(
          "getGroupsUserBelongsTo",
          groupChatTable
        ),
        code: appsync.Code.fromAsset(
          path.join(__dirname, "../resolvers/getGroupsUserBelongsTo.js")
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
          path.join(__dirname, "../resolvers/getMessageUser.js")
        ),
        runtime: appsync.FunctionRuntime.JS_1_0_0,
      });

    groupChatGraphqlApi
    .addDynamoDbDataSource("getUserGroup", groupChatTable)
    .createResolver("userGroupResolver", {
      typeName: "UserGroup",
      fieldName: "groups",
      code: appsync.Code.fromAsset(
        path.join(__dirname, "../resolvers/getUserGroup.js")
      ),
      runtime: appsync.FunctionRuntime.JS_1_0_0,
    });

    groupChatGraphqlApi
    .addDynamoDbDataSource("getGroupUser", groupChatTable)
    .createResolver("groupUserResolver", {
      typeName: "GroupUser",
      fieldName: "user",
      code: appsync.Code.fromAsset(
        path.join(__dirname, "../resolvers/getGroupUser.js")
      ),
      runtime: appsync.FunctionRuntime.JS_1_0_0,
    });
    //   const getAllApartmentsPerBuilding = new appsync.AppsyncFunction(
    //     this,
    //     "getAllApartmentsPerBuilding",
    //     {
    //       name: "getAllApartmentsPerBuilding",
    //       api: airbnbGraphqlApi,
    //       dataSource: airbnbGraphqlApi.addDynamoDbDataSource(
    //         "getAllApartmentsPerBuilding",
    //         airbnbDatabase,
    //       ),
    //       code: bundleAppSyncResolver(
    //         "src/resolvers/apartment/getAllApartmentsPerBuilding.ts",
    //       ),
    //       runtime: appsync.FunctionRuntime.JS_1_0_0,
    //     },
    //   );

    //   new appsync.Resolver(this, "getAllApartmentsPerBuildingResolver", {
    //     api: airbnbGraphqlApi,
    //     typeName: "Query",
    //     fieldName: "getAllApartmentsPerBuilding",
    //     code: appsync.Code.fromAsset(
    //       join(__dirname, "./js_resolvers/_before_and_after_mapping_template.js"),
    //     ),
    //     runtime: appsync.FunctionRuntime.JS_1_0_0,
    //     pipelineConfig: [getAllApartmentsPerBuilding],
    //   });
  }
}

// createGroupResolver.addDependsOn(apiSchema);
// getResultUsersPerGroupResolver.addDependsOn(apiSchema);
// addUserToGroupResolver.addDependsOn(apiSchema);
// getGroupsCreatedByUserResolver.addDependsOn(apiSchema);
// getGroupsUserBelongsToResolver.addDependsOn(apiSchema);
// getGroupResolver.addDependsOn(getGroupsUserBelongsToResolver);
// groupChatTable.grantFullAccess(createGroupLambda);
// groupChatTable.grantFullAccess(addUserToGroupLambda);
// createGroupLambda.addEnvironment("GroupChat_DB", groupChatTable.tableName);
