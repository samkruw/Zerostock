if (!process.env.ZEROSTOCK_VERSION_NAME || !process.env.ZEROSTOCK_VERSION_CODE) {
  throw new Error('Explicit ZEROSTOCK_VERSION_NAME and ZEROSTOCK_VERSION_CODE are required.');
}
await import('./configure-version.mjs');
