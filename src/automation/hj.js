export async function tc(page, theArgs) {
  {
    await page.waitForFunction(() => 'hj' in window);
  }

  {
    await page.waitForFunction(() => 'settings' in window.hj);
  }

  {
    await page.waitForFunction(() => 'site_id' in window.hj.settings);
  }

  {
    const result = {};
    const site_id = await page.evaluate(() => window.hj.settings.site_id);
    const expected = theArgs.id;
    result.site_id = Number(site_id);
    result.expected = Number(expected);
    result.passed = result.site_id === result.expected;
    return result;
  }
}
