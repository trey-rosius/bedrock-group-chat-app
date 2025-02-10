
import {util} from "@aws-appsync/utils"

export function request(ctx) {
    const groupId = ctx.args.groupId
  return {
    operation: "Query",
    index: "getMessagesPerGroup",
    query: {
        expression: "GSI2PK = :GSI2PK and begins_with(GSI2SK, :GSI2SK)",
        expressionValues: util.dynamodb.toMapValues({
            ":GSI2PK": `GROUP#${groupId}`,
            ":GSI2SK": "MESSAGE#"
        })
    }
  }
}

export function response(ctx) {
  return ctx.result;
}
