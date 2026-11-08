const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    amount: { type: Number, required: true, min: -9_999_999_999.99, max: 9_999_999_999.99 },
    type: { type: String, enum: ['income', 'expense'], required: true },
    category: { type: String, required: true, trim: true, maxlength: 80 },
    date: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

transactionSchema.index({ userId: 1, date: -1, createdAt: -1 });
transactionSchema.index({ category: 1, type: 1 });

const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);

module.exports = { Transaction };
