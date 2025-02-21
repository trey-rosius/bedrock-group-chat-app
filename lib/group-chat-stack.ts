import { CfnOutput, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as appsync from "aws-cdk-lib/aws-appsync";
// import { UserPool, UserPoolClient } from "aws-cdk-lib/aws-cognito";

import {
  CfnDataSource,
  CfnGraphQLSchema,
  CfnResolver,
} from "aws-cdk-lib/aws-appsync";

import {} from "aws-cdk-lib/aws-bedrock";
import * as iam from "aws-cdk-lib/aws-iam";
import {
  AttributeType,
  BillingMode,
  ProjectionType,
  StreamViewType,
  Table,
} from "aws-cdk-lib/aws-dynamodb";
import { readFileSync } from "fs";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";

export class GroupChatStack extends Stack {
  public readonly groupChatTable: Table;
  public readonly groupChatGraphqlApi: appsync.GraphqlApi;

  public readonly apiSchema: CfnGraphQLSchema;
  public readonly bedrock_datasource: CfnDataSource;

  public readonly groupChatTableDatasource: CfnDataSource;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    /**
     * UserPool and UserPool Client
     */
    const userPool: cognito.UserPool = new cognito.UserPool(
      this,
      "GroupChatCognitoUserPool",
      {
        selfSignUpEnabled: true,
        accountRecovery: cognito.AccountRecovery.PHONE_AND_EMAIL,
        userVerification: {
          emailStyle: cognito.VerificationEmailStyle.CODE,
        },
        autoVerify: {
          email: true,
        },
        standardAttributes: {
          email: {
            required: true,
            mutable: true,
          },
        },
      }
    );
    const dynamoDBRole = new iam.Role(this, "DynamoDBRole", {
      assumedBy: new iam.ServicePrincipal("appsync.amazonaws.com"),
    });

    dynamoDBRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonDynamoDBFullAccess")
    );
    const bedrockRole = new iam.Role(this, "BedRockRole", {
      assumedBy: new iam.ServicePrincipal("appsync.amazonaws.com"),
    });

    bedrockRole.addToPrincipalPolicy(
      new PolicyStatement({
        resources: [
          "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-5-sonnet-20240620-v1:0",
          "arn:aws:bedrock:us-east-1:132260253285:guardrail/645e94gltocd",
        ],
        actions: ["bedrock:InvokeModel", "bedrock:ApplyGuardrail"],
      })
    );

    const userPoolClient: cognito.UserPoolClient = new cognito.UserPoolClient(
      this,
      "GroupChatUserPoolClient",
      {
        userPool,
      }
    );

    /**
     * CloudWatch Role
     */
    // give appsync permission to log to cloudwatch by assigning a role

    const cloudWatchRole = new iam.Role(this, "appSyncCloudWatchLogs", {
      assumedBy: new iam.ServicePrincipal("appsync.amazonaws.com"),
    });

    cloudWatchRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSAppSyncPushToCloudWatchLogs"
      )
    );

    /**
     * GraphQL API
     */
    this.groupChatGraphqlApi = new appsync.GraphqlApi(this, "Api", {
      name: "profanity-check-groupChat",
      definition: appsync.Definition.fromFile("schema/schema.graphql"),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.API_KEY,
        },

        additionalAuthorizationModes: [
          {
            authorizationType: appsync.AuthorizationType.USER_POOL,
            userPoolConfig: {
              userPool,
            },
          },
        ],
      },
      xrayEnabled: true,
      logConfig: {
        fieldLogLevel: appsync.FieldLogLevel.ALL,
      },
    });

    /**
     * Graphql Schema
     */

    this.apiSchema = new appsync.CfnGraphQLSchema(
      this,
      "airbnbGraphqlApiSchema",
      {
        apiId: this.groupChatGraphqlApi.apiId,
        definition: readFileSync("./schema/schema.graphql").toString(),
      }
    );

    this.groupChatTable = new Table(this, "groupChatDynamoDbTable", {
      tableName: "groupChatDynamoDBTable",

      partitionKey: {
        name: "PK",
        type: AttributeType.STRING,
      },
      sortKey: {
        name: "SK",
        type: AttributeType.STRING,
      },

      billingMode: BillingMode.PAY_PER_REQUEST,
      stream: StreamViewType.NEW_IMAGE,

      removalPolicy: RemovalPolicy.DESTROY,
    });

    this.groupChatTable.addGlobalSecondaryIndex({
      indexName: "getAllUsers",
      partitionKey: {
        name: "ENTITY",
        type: AttributeType.STRING,
      },
      sortKey: {
        name: "SK",
        type: AttributeType.STRING,
      },

      projectionType: ProjectionType.ALL,
    });
    this.groupChatTable.addGlobalSecondaryIndex({
      indexName: "groupsCreatedByUser",
      partitionKey: {
        name: "GSI1PK",
        type: AttributeType.STRING,
      },
      sortKey: {
        name: "GSI1SK",
        type: AttributeType.STRING,
      },

      projectionType: ProjectionType.ALL,
    });
    this.groupChatTable.addGlobalSecondaryIndex({
      indexName: "getMessagesPerGroup",
      partitionKey: {
        name: "GSI2PK",
        type: AttributeType.STRING,
      },
      sortKey: {
        name: "GSI2SK",
        type: AttributeType.STRING,
      },

      projectionType: ProjectionType.ALL,
    });

    this.groupChatTable.addGlobalSecondaryIndex({
      indexName: "groupsUserBelongTo",
      partitionKey: {
        name: "GSI3PK",
        type: AttributeType.STRING,
      },
      sortKey: {
        name: "GSI3SK",
        type: AttributeType.STRING,
      },

      projectionType: ProjectionType.ALL,
    });

    /**
     * Inverted GSI3 to get all users for a group
     */
    this.groupChatTable.addGlobalSecondaryIndex({
      indexName: "getAllUsersPerGroup",
      partitionKey: {
        name: "GSI3SK",
        type: AttributeType.STRING,
      },
      sortKey: {
        name: "GSI3PK",
        type: AttributeType.STRING,
      },

      projectionType: ProjectionType.ALL,
    });

    this.bedrock_datasource = new CfnDataSource(this, "bedrock-datasource", {
      apiId: this.groupChatGraphqlApi.apiId,
      name: "BedrockDataSource",
      type: "AMAZON_BEDROCK_RUNTIME",
      serviceRoleArn: bedrockRole.roleArn,
    });
    new CfnResolver(this, "bedrock-resolver", {
      apiId: this.groupChatGraphqlApi.apiId,
      typeName: "Query",
      fieldName: "detectProfanity",
      dataSourceName: this.bedrock_datasource.name,
      code: `
    import { invokeModel } from "@aws-appsync/utils/ai";
    export function request(ctx) {
      console.log("we're in here");

      return invokeModel({
        modelId: "anthropic.claude-3-5-sonnet-20240620-v1:0",
        guardrailIdentifier: "645e94gltocd",
        guardrailVersion: "1",
  
        body: {
          messages: [
            {
              role: "user",
              content: "Fuck y'all niggas"
              
            }
             
          ],
          max_tokens: 100,
          temperature: 0.5,
          "anthropic_version": "bedrock-2023-05-31",
        },
      });
    }

     export function response(ctx) {
      console.log(\`bedrock response: \${JSON.stringify(ctx.result)}\`);

      // Extract the response content from the Claude model
      if (ctx.result && ctx.result.content && Array.isArray(ctx.result.content)) {
        const responseText = ctx.result.content
          .map((item) => item.text) // Extract the 'text' field from each content item
          .join(" "); // Combine multiple content items into a single string
        return responseText;
      }

      // Fallback response if the structure is unexpected
      return "No valid response from the model.";
    }
  `,

      runtime: {
        name: "APPSYNC_JS",
        runtimeVersion: "1.0.0",
      },
    });

    this.groupChatTableDatasource = new CfnDataSource(
      this,
      "groupChatDynamoDBTableDataSource",
      {
        apiId: this.groupChatGraphqlApi.apiId,
        name: "DynamoDBTableDataSource",
        type: "AMAZON_DYNAMODB",
        dynamoDbConfig: {
          tableName: this.groupChatTable.tableName,
          awsRegion: this.region,
        },
        serviceRoleArn: dynamoDBRole.roleArn,
      }
    );

    /**
     * Outputs
     */

    new CfnOutput(this, "UserPoolId", {
      value: userPool.userPoolId,
    });
    new CfnOutput(this, "UserPoolClientId", {
      value: userPoolClient.userPoolClientId,
    });

    new CfnOutput(this, "GraphQLAPI ID", {
      value: this.groupChatGraphqlApi.apiId,
    });

    new CfnOutput(this, "GraphQLAPI URL", {
      value: this.groupChatGraphqlApi.graphqlUrl,
    });
  }
}
