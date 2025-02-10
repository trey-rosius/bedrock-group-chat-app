
import {util} from "@aws-appsync/utils"

export function request(ctx) {
    const userId = ctx.args.userId
  return {
    operation: "Query",
    index: "groupsUserBelongTo",
    query: {
        expression: "GSI3PK = :GSI3PK and begins_with(GSI3SK, :GSI3SK)",
        expressionValues: util.dynamodb.toMapValues({
            ":GSI3PK": `USER#${userId}`,
            ":GSI3SK": "GROUP#"
        })
    }
  }
}

export function response(ctx) {
  return ctx.result;
}
