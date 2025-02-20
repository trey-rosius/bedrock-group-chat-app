import { Stack, StackProps } from "aws-cdk-lib";
import * as appsync from "aws-cdk-lib/aws-appsync";
import { Table } from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";
import * as path from "path";

interface UserStackProps extends StackProps {
  groupChatGraphqlApi: appsync.GraphqlApi;
  groupChatTable: Table;
}

export class UserStack extends Stack {
  constructor(scope: Construct, id: string, props: UserStackProps) {
    super(scope, id, props);

    const {
      groupChatTable,
      groupChatGraphqlApi
    } = props;
    // Define a single DynamoDB data source
    const userDataSource = groupChatGraphqlApi.addDynamoDbDataSource(
      "UserDataSource",
      groupChatTable
    );

    const createUserAccount = new appsync.AppsyncFunction(
        this,
        "createUserAccount",
        {
          name: "createUserAccount",
          api: groupChatGraphqlApi,
          dataSource: userDataSource,
          code: appsync.Code.fromAsset(path.join(__dirname, "../resolvers/createUserAccount.js")),
          runtime: appsync.FunctionRuntime.JS_1_0_0,
        },
      );
  
      new appsync.Resolver(this, "createUserAccountResolver", {
        api: groupChatGraphqlApi,
        typeName: "Mutation",
        fieldName: "createUserAccount",
        code: appsync.Code.fromAsset(
          path.join(__dirname, "./js_resolvers/_beforeAndAfterMappingTemplate.js"),
        ),
        runtime: appsync.FunctionRuntime.JS_1_0_0,
        pipelineConfig: [createUserAccount],
      });

      const getUserAccount = new appsync.AppsyncFunction(this, "getUserAccount", {
          name: "getUserAccount",
          api: groupChatGraphqlApi,
          dataSource: userDataSource,
          code: appsync.Code.fromAsset(path.join(__dirname, "../resolvers/getUserAccount.js")),
          runtime: appsync.FunctionRuntime.JS_1_0_0,
        });
  
      new appsync.Resolver(this, "getUserAccountResolver", {
        api: groupChatGraphqlApi,
        typeName: "Query",
        fieldName: "getUserAccount",
        code: appsync.Code.fromAsset(
          path.join(__dirname, "./js_resolvers/_beforeAndAfterMappingTemplate.js"),
        ),
        runtime: appsync.FunctionRuntime.JS_1_0_0,
        pipelineConfig: [getUserAccount],
      });

      const getAllUserAccounts = new appsync.AppsyncFunction(this, "getAllUserAccounts", {
        name: "getAllUserAccounts",
        api: groupChatGraphqlApi,
        dataSource: userDataSource,
        code: appsync.Code.fromAsset(path.join(__dirname, "../resolvers/getAllUserAccounts.js")),
        runtime: appsync.FunctionRuntime.JS_1_0_0,
      });

    new appsync.Resolver(this, "getAllUserAccountsResolver", {
      api: groupChatGraphqlApi,
      typeName: "Query",
      fieldName: "getAllUserAccounts",
      code: appsync.Code.fromAsset(
        path.join(__dirname, "./js_resolvers/_beforeAndAfterMappingTemplate.js"),
      ),
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      pipelineConfig: [getAllUserAccounts],
    });
    }
  }

