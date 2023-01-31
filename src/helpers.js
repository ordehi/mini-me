const paramDelimiter = '--';
const paramDivider = '=';

export function parseArgs(args) {
  const params = {};
  const runner = args[args.indexOf(paramDelimiter) + 1];
  params.runner = runner;
  const paramArgs = args.slice(args.indexOf(paramDelimiter) + 2);
  paramArgs.forEach((arg) => {
    const [key, value] = arg.split(paramDivider);
    params[key] = value;
  });
  return params;
}

export function findElement(arr, pattern) {
  const element = arr.find((el) => pattern.test(el));
  return element;
}

export function extractAfterMatch(str, pattern) {
  const value = str.match(pattern);
  if (!!value) return value[0];
  return null;
}

export function errorOut() {
  console.error(...arguments);
  process.exit(1);
}

export function extractArg(theArgs, pattern) {
  const arg = findElement(theArgs, pattern);
  return arg;
}

export function extractArgValue(arg, pattern) {
  const argValue = extractAfterMatch(arg, pattern);
  return argValue;
}
