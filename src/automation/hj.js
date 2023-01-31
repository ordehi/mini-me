import { errorOut } from '../helpers.js';

const messages = {
  settings: 'Checking hj.settings',
  ws: {
    checking: 'Checking if WebSocket can connect',
    connected: 'WebSocket is connected',
    notConnected: 'WebSocket is not connected',
    timeout:
      'A timeout usually means Hotjar is not installed or there was a problem connecting to the WebSocket such as CSP. Or try increasing the timeout',
  },
  tc: {
    checking: 'Checking if Hotjar is installed',
    installed: 'Hotjar is installed',
    notInstalled: 'Hotjar is not installed',
  },
  siteId: {
    checking: 'Checking if site_id is correct',
    correct: 'site_id is correct',
    incorrect: 'site_id is incorrect',
  },
};

const settingsArgs = [
  'site_id',
  'rec_value',
  'user_attributes_enabled',
  'state_change_listen_mode',
  'continuous_capture_enabled',
  'session_capture_console',
  'recording_capture_keystrokes',
  'suppress_all',
  'suppress_text',
  'anonymize_digits',
  'anonymize_emails',
];

const wsArgs = ['_ws', '_wsUrl', '_connected', '_closedPermanently'];

function log(message) {
  console.log(`----${'-'.repeat(message.length)}----`);
  console.log(`--- ${message} ---`);
  console.log(`----${'-'.repeat(message.length)}----`);
}

export async function tc(page) {
  log(messages.tc.checking);
  try {
    await page.waitForFunction(() => 'hj' in window);
    console.log(messages.tc.installed);
    return true;
  } catch (error) {
    errorOut(messages.tc.notInstalled);
  }
}

export async function settings(page) {
  log(messages.settings);
  {
    await page.waitForFunction(() => 'hj' in window);
  }

  {
    await page.waitForFunction(() => 'settings' in window.hj);
  }

  {
    const result = {};
    const settings = await page.evaluate(() => window.hj.settings);

    for (const arg of settingsArgs) {
      result[arg] = settings[arg];
    }

    return result;
  }
}

export async function siteId(page, theArgs) {
  log(messages.siteId);
  let hjSettings;
  let result = {};

  try {
    {
      await tc(page);
    }

    {
      hjSettings = await settings(page);
    }

    {
      const site_id = hjSettings.site_id;
      const expected = theArgs.site_id;
      result.site_id = Number(site_id);
      result.expected = Number(expected);
      result.passed = result.site_id === result.expected;
      if (result.passed) {
        console.log(messages.siteId.correct);
      } else {
        throw new Error(messages.siteId.incorrect);
      }
      return result;
    }
  } catch (error) {
    errorOut(`Testing site_id: ${error}`);
  }
}

export async function ws(page) {
  try {
    {
      await tc(page);
    }

    {
      log(messages.ws.checking);
      await page.evaluate(() => {
        document.cookie = '_hjIncludedInSessionSample=1';
      });
      await page.reload();
    }

    {
      await page.waitForFunction(() => 'eventStream' in window.hj);
    }

    {
      await page.waitForFunction(() => '_ws' in window.hj.eventStream);
    }

    {
      await page.waitForFunction(() => window.hj.eventStream._ws._wsUrl !== '');
    }

    {
      await page.waitForFunction(
        () => window.hj.eventStream._ws._connected !== false
      );
    }

    {
      const result = {};
      const _ws = await page.evaluate(() => window.hj.eventStream._ws);

      for (const arg of wsArgs) {
        result[arg] = _ws[arg];
      }

      if (result._connected === true) {
        console.log(messages.ws.connected);
      } else {
        errorOut(messages.ws.notConnected);
      }
      return result;
    }
  } catch (error) {
    errorOut(`Testing websocket: ${error}\n\n${messages.ws.timeout}`);
  }
}

export const evals = {
  tc,
  settings,
  site_id: siteId,
  ws,
};
