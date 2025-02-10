import { util } from "@aws-appsync/utils";
import { put } from "@aws-appsync/utils/dynamodb";
export function request(ctx) {
  const input = ctx.args.input;
  const id = util.autoId();
  const item = {
    id: id,
    ENTITY: "GROUP",
    GSI1PK: `USER#${input.userId}`,
    GSI1SK: `GROUP#${id}`,
    ...input,
    createdOn: util.time.nowISO8601(),
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