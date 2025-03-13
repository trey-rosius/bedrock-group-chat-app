import { CfnOutput, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as appsync from "aws-cdk-lib/aws-appsync";
import { CfnDataSource, CfnGraphQLSchema } from "aws-cdk-lib/aws-appsync";

import {} from "aws-cdk-lib/aws-bedrock";
import * as iam from "aws-cdk-lib/aws-iam";
import {
  AttributeType,
  BillingMode,
  ProjectionType,
  StreamViewType,
  Table,
} from "aws-cdk-lib/aws-dynamodb";

import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import { bedrock } from "@cdklabs/generative-ai-cdk-constructs";
import {
  ContentFilterStrength,
  ContentFilterType,
} from "@cdklabs/generative-ai-cdk-constructs/lib/cdk-lib/bedrock";

export class GroupChatStack extends Stack {
  public readonly groupChatTable: Table;
  public readonly groupChatGraphqlApi: appsync.GraphqlApi;
  public readonly profanity_guardrail: bedrock.Guardrail;
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

    this.profanity_guardrail = new bedrock.Guardrail(
      this,
      "profanity-guardrail",
      {
        name: "ProfanityGuardrail",
        description:
          "Guardrail to moderate group chat messages for harmful content.",

        deniedTopics: [
          {
            name: "Hate Speech",
            definition:
              "Content that promotes hate or discrimination based on race, gender, religion, or other protected attributes.",
          },
          {
            name: "Violence",
            definition:
              "Content that includes explicit threats of violence or harm to others.",
          },
          {
            name: "Self-Harm",
            definition:
              "Content that encourages or glorifies self-harm or suicide.",
          },
          {
            name: "Illegal Activities",
            definition:
              "Content that promotes or encourages illegal activities.",
          },
        ],

        contentFilters: [
          {
            type: ContentFilterType.SEXUAL,
            inputStrength: ContentFilterStrength.HIGH,
            outputStrength: ContentFilterStrength.NONE,
          },
          {
            type: ContentFilterType.PROMPT_ATTACK,
            inputStrength: ContentFilterStrength.HIGH,
            outputStrength: ContentFilterStrength.NONE,
          },
          {
            type: ContentFilterType.HATE,
            inputStrength: ContentFilterStrength.HIGH,
            outputStrength: ContentFilterStrength.NONE,
          },
        ],
      }
    );
    this.profanity_guardrail.createVersion("profanity guardrail version 1");

    bedrockRole.addToPrincipalPolicy(
      new PolicyStatement({
        resources: [
          "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-5-sonnet-20240620-v1:0",

          this.profanity_guardrail.guardrailArn,
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

    this.groupChatGraphqlApi.addEnvironmentVariable(
      "GUARDRAIL_ID",
      this.profanity_guardrail.guardrailId
    );
    this.groupChatGraphqlApi.addEnvironmentVariable(
      "GUARDRAIL_VERSION",
      this.profanity_guardrail.guardrailVersion
    );
    /**
     * Database
     */

    this.groupChatTable = new Table(this, "groupChatDDbTable", {
      tableName: "groupChatDDBTable",

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

    this.groupChatTableDatasource = new CfnDataSource(
      this,
      "groupChatDynamoDBTableDataSource",
      {
        apiId: this.groupChatGraphqlApi.apiId,
        name: "GroupChatDynamoDBTableDataSource",
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
