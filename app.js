const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const { env } = require('./config/env');
const { errorHandler, notFoundHandler } = require('./middlewares/errorMiddleware');
const { openApiSpec } = require('./utils/openapi');
const adminRoutes = require('./routes/adminRoutes');
const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const { AppError } = require('./utils/AppError');

const app = express();

app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(morgan('combined'));
app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.CORS_ORIGINS.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new AppError('Origin is not allowed by CORS', 403));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: '1mb' }));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
  }),
);

app.get('/health', (_request, response) => {
  response.json({ status: 'ok' });
});
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
app.use(
  '/auth',
  rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-7', legacyHeaders: false }),
  authRoutes,
);
app.use('/transactions', transactionRoutes);
app.use('/categories', categoryRoutes);
app.use('/upload', uploadRoutes);
app.use('/admin', adminRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
