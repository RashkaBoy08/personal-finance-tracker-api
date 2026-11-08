const { z } = require('zod');

const registerSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(254).transform((email) => email.toLowerCase()),
  password: z.string().min(8).max(72),
});

const loginSchema = z.object({
  email: z.string().trim().email().transform((email) => email.toLowerCase()),
  password: z.string().min(1).max(72),
});

const transactionSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    amount: z
      .number()
      .finite()
      .min(-9_999_999_999.99)
      .max(9_999_999_999.99)
      .refine((amount) => Number(amount.toFixed(2)) === amount, 'Amount can have at most 2 decimal places')
      .refine((amount) => amount !== 0, 'Amount must not be zero'),
    type: z.enum(['income', 'expense']),
    category: z.string().trim().min(1).max(80),
    date: z.iso.date(),
  })
  .refine(
    (transaction) =>
      (transaction.type === 'income' && transaction.amount > 0) ||
      (transaction.type === 'expense' && transaction.amount < 0),
    {
      message: 'Income amounts must be positive and expense amounts must be negative',
      path: ['amount'],
    },
  );

const transactionIdSchema = z.string().regex(/^[\da-f]{24}$/i, 'Invalid transaction ID');

const listQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    type: z.enum(['income', 'expense']).optional(),
    category: z.string().trim().min(1).max(80).optional(),
    from: z.iso.date().optional(),
    to: z.iso.date().optional(),
  })
  .refine((query) => !query.from || !query.to || query.from <= query.to, {
    message: '"from" must be on or before "to"',
  });

const summaryQuerySchema = z
  .object({
    year: z.coerce.number().int().min(2000).max(2100).optional(),
    month: z.coerce.number().int().min(1).max(12).optional(),
  })
  .refine((query) => (query.year === undefined) === (query.month === undefined), {
    message: 'Provide both year and month, or neither',
  });

module.exports = {
  registerSchema,
  loginSchema,
  transactionSchema,
  transactionIdSchema,
  listQuerySchema,
  summaryQuerySchema,
};
