import {get} from "@aws-appsync/utils/dynamodb"

export function request(ctx){
    const userId = ctx.source.userId
  return {
    operation: "Query",
    index: "groupsCreatedByUser",
    query: {
        expression: "GSI1PK = :GSI1PK and begins_with(GSI1SK, :GSI1SK)",
        expressionValues: util.dynamodb.toMapValues({
            ":GSI1PK": `USER#${userId}`,
            ":GSI1SK": "GROUP#"
        })
    }
  }
}

export function response(ctx) {
  return ctx.result.items;
}
