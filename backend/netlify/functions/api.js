const serverless = require('serverless-http');
const app = require('../../src/server');

// Wrap Express app as Netlify serverless function
const handler = serverless(app, {
  request: (req, event, context) => {
    // Netlify passes event.body as string — parse it
    if (event.body && typeof event.body === 'string') {
      try { req.body = JSON.parse(event.body); } catch (e) {}
    }
  }
});

exports.handler = async (event, context) => {
  // Keep DB connection alive between invocations
  context.callbackWaitsForEmptyEventLoop = false;
  return handler(event, context);
};
