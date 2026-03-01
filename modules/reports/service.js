const repo = require('./repo');

function getDashboardData() {
  const today = new Date().toISOString().slice(0, 10);
  const monthPrefix = today.slice(0, 7);

  
  const recentSales = repo.listRecentSales(20);
  const recentSalesActiveTotal = recentSales
    .filter((sale) => !sale.is_cancelled)
    .reduce((sum, sale) => sum + sale.total_amount, 0);

  return {
    generatedAt: today,
    financeSummary: repo.getFinanceSummary({ today, monthPrefix }),
    studentBalances: repo.listStudentBalancesWithRemaining(),
    bookStockSummary: repo.listBookStockSummary(),
    recentSales,
    recentSalesActiveTotal,
  };

}

module.exports = {
  getDashboardData,
};
