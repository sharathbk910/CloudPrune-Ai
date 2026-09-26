// Vercel Serverless Function entry point for CloudPrune API routes
const app = require("../server/server");

module.exports = (req, res) => {
  if (req.query && req.query.path) {
    const rawPath = Array.isArray(req.query.path) ? req.query.path.join("/") : req.query.path;
    req.url = `/api/${rawPath}`;
  } else if (req.url.startsWith("/api/index.js")) {
    const matched = req.headers["x-matched-path"] || req.headers["x-now-route-matches"];
    if (matched && matched.startsWith("/api")) {
      req.url = matched;
    } else {
      req.url = req.url.replace(/^\/api\/index\.js/, "/api");
    }
  }
  return app(req, res);
};
