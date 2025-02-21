#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { GroupChatStack } from "../lib/group-chat-stack";
import { GroupStacks } from "../lib/group-stack";
import { UserStack } from "../lib/user-stack";
import { MessageStack } from "../lib/message-stack";

const app = new cdk.App();
const groupChatStack = new GroupChatStack(app, "GroupChatStack", {
  /* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but a single synthesized template can be deployed anywhere. */
  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  /* Uncomment the next line if you know exactly what Account and Region you
   * want to deploy the stack to. */
  // env: { account: '123456789012', region: 'us-east-1' },
  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});

new GroupStacks(app, "GroupStacks", {
  groupChatTable: groupChatStack.groupChatTable,
  groupChatGraphqlApi: groupChatStack.groupChatGraphqlApi,
});
new UserStack(app, "UserStacks", {
  groupChatTable: groupChatStack.groupChatTable,
  groupChatGraphqlApi: groupChatStack.groupChatGraphqlApi,
});
new MessageStack(app, "MessageStack", {
  groupChatTable: groupChatStack.groupChatTable,
  groupChatGraphqlApi: groupChatStack.groupChatGraphqlApi,
});
