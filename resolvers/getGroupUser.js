import {get} from "@aws-appsync/utils/dynamodb"

export function request(ctx){
    const groupId = ctx.source.groupId
  return {
    // operation: "Query",
    // index: "groupsUserBelongTo",
    query: {
        expression: "PK = :PK and begins_with(SK, :SK)",
        expressionValues: util.dynamodb.toMapValues({
            ":PK": `GROUP#${groupId}`,
            ":SK": "USER#"
        })
    }
  }
}

export function response(ctx) {
  return ctx.result.items;
}
