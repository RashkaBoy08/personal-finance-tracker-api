const multer = require('multer');
const { ZodError } = require('zod');
const { AppError } = require('../utils/AppError');

function notFoundHandler(request, _response, next) {
  next(new AppError(`Route ${request.method} ${request.path} was not found`, 404));
}

function errorHandler(error, _request, response, _next) {
  if (error instanceof ZodError) {
    response.status(400).json({
      error: 'Validation failed',
      details: error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
    return;
  }

  if (error instanceof multer.MulterError) {
    response.status(error.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({ error: error.message });
    return;
  }

  if (isBodyParserError(error)) {
    response.status(error.status).json({
      error: error.status === 413 ? 'Request body is too large' : 'Malformed request body',
    });
    return;
  }

  if (error instanceof AppError) {
    response.status(error.statusCode).json({ error: error.message });
    return;
  }

  console.error('Unhandled request error:', error);
  response.status(500).json({ error: 'Internal server error' });
}

function isBodyParserError(error) {
  return (
    typeof error === 'object' &&
    error !== null &&
    typeof error.type === 'string' &&
    (error.status === 400 || error.status === 413) &&
    ['entity.parse.failed', 'entity.too.large'].includes(error.type)
  );
}

module.exports = { notFoundHandler, errorHandler };
