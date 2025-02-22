import { util } from "@aws-appsync/utils";
import { put } from "@aws-appsync/utils/dynamodb";
export function request(ctx) {
  console.log(`previous context ${ctx}`);
  const input = ctx.args.input;
  const id = util.autoId();
  const item = {
    id: id,
    ...input,
    ENTITY: "MESSAGE",
    GSI2PK: `GROUP#${input.groupId}`,
    GSI2SK: `MESSAGE#${id}`,
    createdOn: util.time.nowEpochMilliSeconds(),
  };
  const key = {
    PK: `MESSAGE#${id}`,
    SK: `MESSAGE`,
  };

  return put({
    key: key,
    item: item,
  });
}

export function response(ctx) {
  return ctx.result;
}
