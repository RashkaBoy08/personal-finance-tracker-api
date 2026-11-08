const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const { User } = require('../models/userModel');
const { AppError } = require('../utils/AppError');
const { registerSchema, loginSchema } = require('../utils/validators');

async function register(request, response) {
  const input = registerSchema.parse(request.body);
  const passwordHash = await bcrypt.hash(input.password, 12);

  try {
    const user = await User.create({
      name: input.name,
      email: input.email,
      passwordHash,
    });
    response.status(201).json({
      user: toPublicUser(user),
      token: createToken(user.id),
    });
  } catch (error) {
    if (error && error.code === 11000) {
      throw new AppError('An account with this email already exists', 409);
    }
    throw error;
  }
}

async function login(request, response) {
  const input = loginSchema.parse(request.body);
  const user = await User.findOne({ email: input.email }).select('+passwordHash');
  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
    throw new AppError('Invalid email or password', 401);
  }

  response.json({
    user: toPublicUser(user),
    token: createToken(user.id),
  });
}

function getProfile(request, response) {
  response.json({ user: request.user });
}

function createToken(userId) {
  return jwt.sign({ sub: userId }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}

function toPublicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    profilePictureUrl: user.profilePictureUrl,
  };
}

module.exports = { register, login, getProfile };
