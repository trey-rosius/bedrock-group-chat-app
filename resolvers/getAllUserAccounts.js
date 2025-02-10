
import {util} from "@aws-appsync/utils"

export function request(ctx) {
  return {
    operation: "Query",
    index: "getAllUsers",
    query: {
        expression: "ENTITY = :ENTITY and begins_with(SK, :SK)",
        expressionValues: util.dynamodb.toMapValues({
            ":ENTITY": `USER`,
            ":SK": "USER"
        })
    }
  }
}

export function response(ctx) {
  return ctx.result;
}
