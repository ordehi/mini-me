import { launch } from 'puppeteer';
import { evals } from './hj.js';

async function tryCatch(fn, params, name) {
  try {
    const result = await fn(params);
    return result || `executed ${name}...`;
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

function findInElements(elements, selector) {
  return elements.find((element) => element.selector === selector);
}

async function getValue(element) {
  return await element.evaluate((el) => el.value);
}

async function press(params) {
  const { element, times, key } = params;
  for (let i = 0; i < times; i++) {
    await element.press(key);
  }
}

// with puppeteer evaluate a function in the context of the page

const functions = {
  launch: async (params) => {
    const options = params.step;
    const browser = await launch(options);
    params.state.browser = browser;
    return 'launched browser...';
  },
  page: async (params) => {
    const timeout = Number(params.args.timeout) || params.step.timeout;
    const { browser } = params.state;
    const page = await browser.newPage();
    params.state.page = page;
    params.state.page.setDefaultTimeout(timeout || 30000);
    params.state.waitOptions = params.step;
    return 'created page...';
  },
  close: async (params) => {
    const { browser } = params.state;
    await browser.close();
  },
  wait: async (params) => {
    const { page } = params.state;
    const timeout = Number(params.args.timeout) || params.step.timeout;
    await page.waitForTimeout(timeout);
  },
  navigate: async (params) => {
    const targetPage = params.state.page;
    const url = params.args.url || params.step;
    const promises = [];
    promises.push(targetPage.waitForNavigation());
    await targetPage.goto(url);
    await Promise.all(promises);
    console.log('navigated to ' + url);
  },
  select: async (params) => {
    const { page } = params.state;
    const { by, selector, options } = params.step;
    const prefix = (by && by !== 'css' && `${by}/`) || '';
    console.log(prefix);
    const element = await page.waitForSelector(
      prefix + selector,
      options || params.state.waitOptions
    );
    params.state.elements.push({ element, selector });
  },
  click: async (params) => {
    const { page } = params.state;
    const { selector, options } = params.step;
    const element = await page.waitForSelector(
      selector,
      options || params.state.waitOptions
    );
    await element.click(options);
    console.log('clicked element with selector: ' + selector);
  },
  prevClick: async (params) => {
    const { page } = params.state;
    const { selector, options } = params.step;
    const element = findInElements(params.state.elements, selector).element;
    await element.click(options);
  },
  prevType: async (params) => {
    const { page } = params.state;
    const { selector, text, options } = params.step;
    const element = findInElements(params.state.elements, selector).element;
    await element.type(text, options || params.state.waitOptions);
  },
  pageType: async (params) => {
    const { page } = params.state;
    const { selector, text, options } = params.step;
    await page.type(selector, text, options || params.state.waitOptions);
  },
  type: async (params) => {
    const { page } = params.state;
    const { selector, text, options } = params.step;
    const element = await page.waitForSelector(selector, options);
    await element.type(text, options);
  },
  press,
  prevPress: async (params) => {
    const { page } = params.state;
    const { selector, key, options } = params.step;
    const element = findInElements(params.state.elements, selector).element;
    await element.press(key, options);
  },
  clear: async (params) => {
    const { page } = params.state;
    const { selector, options } = params.step;
    const element = await page.waitForSelector(
      selector,
      options || params.state.waitOptions
    );
    const value = await getValue(element);
    const end = {
      element,
      times: 1,
      key: 'End',
    };

    const back = {
      element,
      times: value.length,
      key: 'Backspace',
    };

    await press(end);
    await press(back);
    console.log('cleared element with selector: ' + selector);
  },
  evaluate: async (params) => {
    const { page } = params.state;
    const fn = params.args.runner || params.step.fn;
    const args = params.args || params.step.args;
    const result = await evals[fn](page, args);
    return result;
  },
};

async function puppet(suite, theArgs) {
  const state = {
    browser: null,
    page: null,
    elements: [],
    waitOptions: {},
  };

  for (const step of suite.steps) {
    const result = await tryCatch(
      functions[step.type],
      {
        step: step.params,
        state,
        args: theArgs,
      },
      step.type
    );
    console.log(result);
  }
}

export default puppet;
