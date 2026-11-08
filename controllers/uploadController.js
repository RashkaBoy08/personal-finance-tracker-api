const { v2: cloudinary } = require('cloudinary');
const { env } = require('../config/env');
const { User } = require('../models/userModel');
const { AppError } = require('../utils/AppError');

async function uploadProfilePicture(request, response) {
  if (!env.cloudinaryConfigured) {
    throw new AppError('Profile picture uploads are not configured', 503);
  }
  if (!request.file) {
    throw new AppError('An image file is required in the "image" field', 400);
  }

  const uploaded = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'personal-finance-tracker/profile-pictures', resource_type: 'image' },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        if (!result) {
          reject(new Error('Cloudinary returned no upload result'));
          return;
        }
        resolve(result);
      },
    );
    stream.end(request.file.buffer);
  });

  await User.findByIdAndUpdate(
    request.user.id,
    { profilePictureUrl: uploaded.secure_url },
    { returnDocument: 'after' },
  );
  response.json({ profilePictureUrl: uploaded.secure_url });
}

module.exports = { uploadProfilePicture };
