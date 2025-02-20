import { util } from "@aws-appsync/utils";
import { put } from "@aws-appsync/utils/dynamodb";
export function request(ctx) {
  const input = ctx.args.input;
  const id = util.autoId();
  const item = {
    id: id,
    ENTITY: "TYPING",
    PK: `USER#${userId}`,
    SK: `GROUP#${groupId}#TYPING`,
    userId: userId,
    groupId: groupId,
    typing: typing,
    createdOn: createdOn,
  };
  const key = {
    PK: `GROUP#${id}`,
    SK: `GROUP#${id}`,
  };

  return put({
    key: key,
    item: item,
  });
}

export function response(ctx) {
  return ctx.result;
}