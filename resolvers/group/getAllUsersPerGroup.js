
import {util} from "@aws-appsync/utils"

export function request(ctx) {
    const groupId = ctx.args.groupId
  return {
    operation: "Query",
    index: "getAllUsersPerGroup",
    query: {
        expression: "GSI3PK = :GSI3PK and begins_with(GSI3SK, :GSI3SK)",
        expressionValues: util.dynamodb.toMapValues({
            ":GSI3PK": `GROUP#${groupId}`,
            ":GSI3SK": "USER#"
        })
    }
  }
}

export function response(ctx) {
  return ctx.result;
}
