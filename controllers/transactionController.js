const mongoose = require('mongoose');
const { Transaction } = require('../models/transactionModel');
const { AppError } = require('../utils/AppError');
const { formatDate } = require('../utils/formatDate');
const {
  transactionSchema,
  transactionIdSchema,
  listQuerySchema,
  summaryQuerySchema,
} = require('../utils/validators');

async function createTransaction(request, response) {
  const input = transactionSchema.parse(request.body);
  const transaction = await Transaction.create({
    userId: request.user.id,
    title: input.title,
    amount: input.amount,
    type: input.type,
    category: input.category,
    date: parseDate(input.date),
  });
  response.status(201).json({ transaction: formatTransaction(transaction) });
}

async function listTransactions(request, response) {
  const query = listQuerySchema.parse(request.query);
  const filter = { userId: new mongoose.Types.ObjectId(request.user.id) };
  if (query.type) filter.type = query.type;
  if (query.category) filter.category = query.category;
  if (query.from || query.to) {
    const date = {};
    if (query.from) date.$gte = parseDate(query.from);
    if (query.to) date.$lt = new Date(parseDate(query.to).getTime() + 24 * 60 * 60 * 1000);
    filter.date = date;
  }

  const [transactions, total] = await Promise.all([
    Transaction.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .lean(),
    Transaction.countDocuments(filter),
  ]);
  response.json({
    transactions: transactions.map(formatTransaction),
    pagination: { page: query.page, limit: query.limit, total },
  });
}

async function getMonthlySummary(request, response) {
  const query = summaryQuerySchema.parse(request.query);
  const now = new Date();
  const year = query.year || now.getUTCFullYear();
  const month = query.month || now.getUTCMonth() + 1;
  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 1));
  const rows = await Transaction.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(request.user.id),
        date: { $gte: startDate, $lt: endDate },
      },
    },
    {
      $group: {
        _id: '$category',
        income: { $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] } },
        expenses: { $sum: { $cond: [{ $eq: ['$type', 'expense'] }, { $abs: '$amount' }, 0] } },
        net: { $sum: '$amount' },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  const categories = rows.map((row) => ({
    category: row._id,
    income: roundMoney(row.income),
    expenses: roundMoney(row.expenses),
    net: roundMoney(row.net),
  }));
  response.json({
    year,
    month,
    categories,
    totals: {
      income: sum(categories.map((category) => category.income)),
      expenses: sum(categories.map((category) => category.expenses)),
      net: sum(categories.map((category) => category.net)),
    },
  });
}

async function updateTransaction(request, response) {
  const id = transactionIdSchema.parse(request.params.id);
  const input = transactionSchema.parse(request.body);
  const transaction = await Transaction.findOneAndUpdate(
    { _id: id, userId: request.user.id },
    {
      title: input.title,
      amount: input.amount,
      type: input.type,
      category: input.category,
      date: parseDate(input.date),
    },
    { returnDocument: 'after', runValidators: true, includeResultMetadata: false },
  );
  if (!transaction) throw new AppError('Transaction was not found', 404);
  response.json({ transaction: formatTransaction(transaction) });
}

async function deleteTransaction(request, response) {
  const id = transactionIdSchema.parse(request.params.id);
  const transaction = await Transaction.findOneAndDelete({
    _id: id,
    userId: request.user.id,
  });
  if (!transaction) throw new AppError('Transaction was not found', 404);
  response.status(204).send();
}

function parseDate(date) {
  return new Date(`${date}T00:00:00.000Z`);
}

function formatTransaction(transaction) {
  return {
    id: transaction._id.toString(),
    title: transaction.title,
    amount: transaction.amount,
    type: transaction.type,
    category: transaction.category,
    date: formatDate(transaction.date),
    createdAt: transaction.createdAt,
  };
}

function roundMoney(value) {
  return Math.round(value * 100) / 100;
}

function sum(values) {
  return roundMoney(values.reduce((total, value) => total + value, 0));
}

module.exports = {
  createTransaction,
  listTransactions,
  getMonthlySummary,
  updateTransaction,
  deleteTransaction,
};
