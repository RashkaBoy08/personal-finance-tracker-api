const { Category } = require('../models/categoryModel');

async function listCategories(_request, response) {
  const categories = await Category.find().sort({ name: 1 }).lean();
  response.json({
    categories: categories.map((category) => ({
      id: category._id.toString(),
      name: category.name,
    })),
  });
}

module.exports = { listCategories };
