const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const { User } = require('../models/userModel');
const { AppError } = require('../utils/AppError');

async function authenticate(request, _response, next) {
  const authorization = request.header('authorization');
  if (!authorization || !authorization.startsWith('Bearer ')) {
    throw new AppError('Authentication token is required', 401);
  }

  let userId;
  try {
    const payload = jwt.verify(authorization.slice(7), env.JWT_SECRET);
    if (typeof payload.sub !== 'string') {
      throw new AppError('Invalid authentication token', 401);
    }
    userId = payload.sub;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Invalid or expired authentication token', 401);
  }

  if (!/^[\da-f]{24}$/i.test(userId)) {
    throw new AppError('Invalid authentication token', 401);
  }

  const user = await User.findById(userId).select('name email role profilePictureUrl').lean();
  if (!user) {
    throw new AppError('User account was not found', 401);
  }

  request.user = {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    profilePictureUrl: user.profilePictureUrl,
  };
  next();
}

function requireAdmin(request, _response, next) {
  if (!request.user || request.user.role !== 'admin') {
    throw new AppError('Administrator access is required', 403);
  }
  next();
}

module.exports = { authenticate, requireAdmin };
