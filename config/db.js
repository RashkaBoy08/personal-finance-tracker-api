const mongoose = require('mongoose');
const { env } = require('./env');
const { Category } = require('../models/categoryModel');

const predefinedCategories = [
  'Food',
  'Transportation',
  'Housing',
  'Utilities',
  'Healthcare',
  'Entertainment',
  'Shopping',
  'Education',
  'Salary',
  'Freelance',
  'Investment',
  'Other',
];

async function connectDB() {
  await mongoose.connect(env.MONGODB_URI);
  await Category.bulkWrite(
    predefinedCategories.map((name) => ({
      updateOne: {
        filter: { name },
        update: { $setOnInsert: { name } },
        upsert: true,
      },
    })),
  );
  console.log('Connected to MongoDB');
}

module.exports = { connectDB };
