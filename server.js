// CloudPrune AI Root Server Entry
const app = require("./server/server");
const PORT = process.env.PORT || 3001;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 CloudPrune AI FinOps Server running on port ${PORT}`);
    console.log(`📍 Web Dashboard: http://localhost:${PORT}`);
    console.log(`📊 API Health:    http://localhost:${PORT}/api/health`);
    console.log(`====================================================`);
  });
}

module.exports = app;

