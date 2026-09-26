// Vercel Serverless Function entry point for CloudPrune API routes
const app = require("../server/server");

module.exports = (req, res) => {
  // Normalize req.url if rewritten by Vercel
  if (req.url.startsWith("/api/index.js")) {
    const matched = req.headers["x-matched-path"] || req.headers["x-now-route-matches"];
    if (matched && matched.startsWith("/api")) {
      req.url = matched;
    } else {
      req.url = req.url.replace(/^\/api\/index\.js/, "/api");
    }
  }
  return app(req, res);
};
