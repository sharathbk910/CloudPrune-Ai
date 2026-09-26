// Vercel Serverless Function Catch-All for /api/*
const app = require("../server/server");

module.exports = (req, res) => {
  if (req.query && req.query.path) {
    const rawPath = Array.isArray(req.query.path) ? req.query.path.join("/") : req.query.path;
    req.url = `/api/${rawPath}`;
  }
  return app(req, res);
};
