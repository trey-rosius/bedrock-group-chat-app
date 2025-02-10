import { CfnOutput, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as appsync from "aws-cdk-lib/aws-appsync";
// import { UserPool, UserPoolClient } from "aws-cdk-lib/aws-cognito";

import {
  CfnDataSource,
  CfnGraphQLApi,
  CfnGraphQLSchema,
} from "aws-cdk-lib/aws-appsync";
import * as iam from "aws-cdk-lib/aws-iam";
import {
  AttributeType,
  BillingMode,
  ProjectionType,
  StreamViewType,
  Table,
} from "aws-cdk-lib/aws-dynamodb";
import { readFileSync } from "fs";
// import { ManagedPolicy, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";

export class GroupChatStack extends Stack {
  public readonly groupChatTable: Table;
  public readonly groupChatGraphqlApi: appsync.GraphqlApi;
  public readonly apiSchema: CfnGraphQLSchema;
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
      name: "groupChat",
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

    this.apiSchema = new appsync.CfnGraphQLSchema(this, "airbnbGraphqlApiSchema", {
      apiId: this.groupChatGraphqlApi.apiId,
      definition: readFileSync("./schema/schema.graphql").toString(),
    });

    // /**
    //  * GraphQL API
    //  */
    // this.groupChatGraphqlApi = new CfnGraphQLApi(this, "groupChatGraphqlApi", {
    //   name: "groupChat",
    //   authenticationType: "API_KEY",

    //   additionalAuthenticationProviders: [
    //     {
    //       authenticationType: "AMAZON_COGNITO_USER_POOLS",

    //       userPoolConfig: {
    //         userPoolId: userPool.userPoolId,
    //         awsRegion: "us-east-1",
    //       },
    //     },
    //   ],
    //   userPoolConfig: {
    //     userPoolId: userPool.userPoolId,
    //     defaultAction: "ALLOW",
    //     awsRegion: "us-east-1",
    //   },

    //   logConfig: {
    //     fieldLogLevel: "ALL",
    //     cloudWatchLogsRoleArn: cloudWatchRole.roleArn,
    //   },
    //   xrayEnabled: true,
    // });

    // /**
    //  * Graphql Schema
    //  */

    // this.apiSchema = new CfnGraphQLSchema(this, "GroupChatGraphqlApiSchema", {
    //   apiId: this.groupChatGraphqlApi.attrApiId,
    //   definition: readFileSync("./schema/schema.graphql").toString(),
    // });

    /**
     * Database
     */

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

    this.groupChatTableDatasource = new CfnDataSource(
      this,
      "groupChatDynamoDBTableDataSource",
      {
        apiId: this.groupChatGraphqlApi.apiId,
        name: "AcmsDynamoDBTableDataSource",
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