const { env } = require('../config/env');

const bearer = [{ bearerAuth: [] }];

const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Personal Finance Tracker API',
    version: '1.0.0',
    description: 'Track income and expenses with per-user data isolation.',
  },
  servers: [{ url: env.PUBLIC_API_URL || '/', description: 'Current server' }],
  tags: [
    { name: 'Auth' },
    { name: 'Transactions' },
    { name: 'Categories' },
    { name: 'Upload' },
    { name: 'Admin' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      Credentials: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8, maxLength: 72 },
        },
      },
      TransactionInput: {
        type: 'object',
        required: ['title', 'amount', 'type', 'category', 'date'],
        properties: {
          title: { type: 'string', maxLength: 200 },
          amount: { type: 'number', description: 'Positive for income; negative for expense.' },
          type: { type: 'string', enum: ['income', 'expense'] },
          category: { type: 'string', maxLength: 80 },
          date: { type: 'string', format: 'date' },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['Auth'],
        summary: 'Check API availability',
        responses: { 200: { description: 'API is running.' } },
      },
    },
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a user account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string', maxLength: 100 },
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8, maxLength: 72 },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Account created; returns the user and JWT.' },
          400: { description: 'Invalid input.' },
          409: { description: 'Email is already registered.' },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Log in and obtain a JWT',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Credentials' } } },
        },
        responses: {
          200: { description: 'Authenticated; returns the user and JWT.' },
          401: { description: 'Invalid email or password.' },
        },
      },
    },
    '/auth/profile': {
      get: {
        tags: ['Auth'],
        summary: 'Get the authenticated user profile',
        security: bearer,
        responses: {
          200: { description: 'Current user profile.' },
          401: { description: 'Missing or invalid JWT.' },
        },
      },
    },
    '/categories': {
      get: {
        tags: ['Categories'],
        summary: 'List predefined categories',
        security: bearer,
        responses: { 200: { description: 'Categories ordered by name.' } },
      },
    },
    '/transactions': {
      get: {
        tags: ['Transactions'],
        summary: 'List the current user’s transactions',
        security: bearer,
        parameters: [
          { in: 'query', name: 'page', schema: { type: 'integer', minimum: 1 } },
          { in: 'query', name: 'limit', schema: { type: 'integer', minimum: 1, maximum: 100 } },
          { in: 'query', name: 'type', schema: { type: 'string', enum: ['income', 'expense'] } },
          { in: 'query', name: 'category', schema: { type: 'string' } },
          { in: 'query', name: 'from', schema: { type: 'string', format: 'date' } },
          { in: 'query', name: 'to', schema: { type: 'string', format: 'date' } },
        ],
        responses: { 200: { description: 'Paginated transactions.' } },
      },
      post: {
        tags: ['Transactions'],
        summary: 'Add an income or expense',
        security: bearer,
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/TransactionInput' } },
          },
        },
        responses: {
          201: { description: 'Transaction created.' },
          400: { description: 'Invalid input.' },
        },
      },
    },
    '/transactions/monthly-summary': {
      get: {
        tags: ['Transactions'],
        summary: 'Get monthly income, expenses, and net totals by category',
        security: bearer,
        parameters: [
          { in: 'query', name: 'year', schema: { type: 'integer', minimum: 2000, maximum: 2100 } },
          { in: 'query', name: 'month', schema: { type: 'integer', minimum: 1, maximum: 12 } },
        ],
        responses: {
          200: { description: 'Category breakdown and monthly totals. Defaults to the current UTC month.' },
          400: { description: 'Provide both year and month, or neither.' },
        },
      },
    },
    '/transactions/{id}': {
      put: {
        tags: ['Transactions'],
        summary: 'Replace a transaction owned by the current user',
        security: bearer,
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'objectId' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/TransactionInput' } },
          },
        },
        responses: {
          200: { description: 'Transaction updated.' },
          404: { description: 'Transaction not found.' },
        },
      },
      delete: {
        tags: ['Transactions'],
        summary: 'Delete a transaction owned by the current user',
        security: bearer,
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'objectId' } }],
        responses: {
          204: { description: 'Transaction deleted.' },
          404: { description: 'Transaction not found.' },
        },
      },
    },
    '/upload/profile-picture': {
      post: {
        tags: ['Upload'],
        summary: 'Upload a JPEG, PNG, or WebP profile picture (maximum 5 MB)',
        security: bearer,
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['image'],
                properties: { image: { type: 'string', format: 'binary' } },
              },
            },
          },
        },
        responses: {
          200: { description: 'Profile picture uploaded and attached to the user.' },
          400: { description: 'Missing file or unsupported image format.' },
          503: { description: 'Cloudinary is not configured.' },
        },
      },
    },
    '/admin/overview': {
      get: {
        tags: ['Admin'],
        summary: 'Get aggregate user and spending statistics',
        security: bearer,
        responses: {
          200: { description: 'Overview available to administrators.' },
          403: { description: 'Administrator role required.' },
        },
      },
    },
  },
};

module.exports = { openApiSpec };
