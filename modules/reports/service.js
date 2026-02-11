const repo = require('./repo');

function getDashboardData() {
  const today = new Date().toISOString().slice(0, 10);
  const monthPrefix = today.slice(0, 7);

  return {
    generatedAt: today,
    financeSummary: repo.getFinanceSummary({ today, monthPrefix }),
    studentBalances: repo.listStudentBalancesWithRemaining(),
    bookStockSummary: repo.listBookStockSummary(),
    recentSales: repo.listRecentSales(20),
  };
}

module.exports = {
  getDashboardData,
};
