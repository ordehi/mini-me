import { parseArgs } from './helpers.js';
import puppet from './automation/puppet.js';

async function mediator(params) {
  const args = parseArgs(params);
  const test = await import(`./suites/${params[0]}.json`, {
    assert: { type: 'json' },
  });
  return await puppet(test.default, args);
}

export default mediator;
