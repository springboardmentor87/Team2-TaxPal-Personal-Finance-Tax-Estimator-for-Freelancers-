const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/http');
const {
  createCategory: createCategoryService,
  deleteCategory: deleteCategoryService,
  getCategoryAnalytics,
  getCategoryById,
  listCategories,
  updateCategory: updateCategoryService
} = require('../services/categoryService');

const createCategory = asyncHandler(async (req, res) => {
  const category = await createCategoryService(req.userId, req.body);
  return sendSuccess(res, 201, 'Category created successfully', category);
});

const getCategories = asyncHandler(async (req, res) => {
  const categories = await listCategories(req.userId);
  return sendSuccess(res, 200, 'Categories fetched successfully', {
    items: categories
  });
});

const getCategory = asyncHandler(async (req, res) => {
  const category = await getCategoryById(req.userId, req.params.id);
  return sendSuccess(res, 200, 'Category fetched successfully', category);
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await updateCategoryService(req.userId, req.params.id, req.body);
  return sendSuccess(res, 200, 'Category updated successfully', category);
});

const deleteCategory = asyncHandler(async (req, res) => {
  await deleteCategoryService(req.userId, req.params.id);
  return sendSuccess(res, 200, 'Category deleted successfully');
});

const getAnalytics = asyncHandler(async (req, res) => {
  const analytics = await getCategoryAnalytics(req.userId);
  return sendSuccess(res, 200, 'Category analytics fetched successfully', analytics);
});

module.exports = {
  createCategory,
  deleteCategory,
  getAnalytics,
  getCategory,
  getCategories,
  updateCategory
};