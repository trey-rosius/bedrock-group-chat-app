import {get} from "@aws-appsync/utils/dynamodb"

export function request(ctx){
    return get({key:{PK:`USER#${ctx.args.userId}`, SK:`USER`}})
}

export function response(ctx){
    return ctx.result;
}