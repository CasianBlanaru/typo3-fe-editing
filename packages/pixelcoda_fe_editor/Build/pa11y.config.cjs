module.exports = {
  standard: 'WCAG2AA',
  runners: ['axe', 'htmlcs'],
  level: 'error',
  timeout: 30000,
  wait: 500,
  chromeLaunchConfig: {
    ignoreHTTPSErrors: true,
    args: [
      '--no-sandbox',
      '--ignore-certificate-errors'
    ]
  }
};
