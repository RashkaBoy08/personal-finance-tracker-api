const bcrypt = require('bcryptjs');

async function createBootstrapAdmin(User, env) {
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) {
    return;
  }

  const email = env.ADMIN_EMAIL.toLowerCase();
  const existingAdmin = await User.exists({ email });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, 12);
    await User.create({
      name: 'Administrator',
      email,
      passwordHash,
      role: 'admin',
    });
  }
}

module.exports = { createBootstrapAdmin };
