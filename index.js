import mediator from './src/mediator.js';
import { errorOut } from './src/helpers.js';
import { noArgsMsg } from './src/constants/messages.js';

const args = process.argv.slice(2);
if (args.length === 0) errorOut(noArgsMsg);

try {
  const result = await mediator(args);
  console.log(result);
} catch (err) {
  errorOut(err);
}
