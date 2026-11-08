const { Transaction } = require('../models/transactionModel');
const { User } = require('../models/userModel');

async function getOverview(_request, response) {
  const [totalUsers, totalTransactions, categories] = await Promise.all([
    User.countDocuments(),
    Transaction.countDocuments(),
    Transaction.aggregate([
      { $match: { type: 'expense' } },
      {
        $group: {
          _id: '$category',
          totalSpent: { $sum: { $abs: '$amount' } },
          transactionCount: { $sum: 1 },
        },
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 5 },
    ]),
  ]);

  response.json({
    totalUsers,
    totalTransactions,
    topSpendingCategories: categories.map((row) => ({
      category: row._id,
      totalSpent: Math.round(row.totalSpent * 100) / 100,
      transactionCount: row.transactionCount,
    })),
  });
}

module.exports = { getOverview };
