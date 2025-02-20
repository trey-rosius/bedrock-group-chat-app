import { util } from "@aws-appsync/utils";
import { put } from "@aws-appsync/utils/dynamodb";
export function request(ctx) {
  const input = ctx.args.userId;
  const id = util.autoId();
  const item = {
    GSI3PK: `USER#${ctx.args.userId}`,
    GSI3SK: `GROUP#${ctx.args.groupId}`,
    createdOn: util.time.nowISO8601(),
  };
  const key = {
    PK: `GROUP#${ctx.args.groupId}`,
    SK: `USER#${ctx.args.userId}`,
  };

  return put({
    key: key,
    item: item,
  });
}

export function response(ctx) {
  return true;
}