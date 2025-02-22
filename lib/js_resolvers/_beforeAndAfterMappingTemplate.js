export function request(ctx) {
  const { args } = ctx;
  console.log(args);
  return {};
}

// The after step
export function response(ctx) {
  return ctx.prev.result;
}
