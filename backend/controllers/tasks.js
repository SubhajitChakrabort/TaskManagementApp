const Task = require('../models/Task');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Get all tasks
// @route   GET /api/v1/tasks
// @access  Private
exports.getTasks = asyncHandler(async (req, res, next) => {
  // Copy req.query
  const reqQuery = { ...req.query };
  
  // Fields to exclude
  const removeFields = ['select', 'sort', 'page', 'limit', 'search'];
  
  // Loop over removeFields and delete them from reqQuery
  removeFields.forEach(param => delete reqQuery[param]);
  
  // Create query string
  let queryStr = JSON.stringify(reqQuery);
  
  // Create operators ($gt, $gte, etc)
  queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);
  
  // Parse query and add user filter
  const parsedQuery = JSON.parse(queryStr);
  parsedQuery.user = req.user._id;
  
  // Add search functionality for title and description
  if (req.query.search) {
    parsedQuery.$or = [
      { title: { $regex: req.query.search, $options: 'i' } },
      { description: { $regex: req.query.search, $options: 'i' } }
    ];
  }
  
  // Finding resource
  let query = Task.find(parsedQuery).populate('user', 'name email');
  
  // Select Fields
  if (req.query.select) {
    const fields = req.query.select.split(',').join(' ');
    query = query.select(fields);
  }
  
  // Sort
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt');
  }
  
  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await Task.countDocuments(parsedQuery);
  
  query = query.skip(startIndex).limit(limit);
  
  // Executing query
  const tasks = await query;
  
  // Pagination result
  const pagination = {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit)
  };
  
  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit
    };
  }
  
  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit
    };
  }
  
  res.status(200).json({
    success: true,
    count: total,
    pagination,
    data: tasks
  });
});

// @desc    Get single task
// @route   GET /api/v1/tasks/:id
// @access  Private
exports.getTask = asyncHandler(async (req, res, next) => {
  const task = await Task.findById(req.params.id).populate('user', 'name email');
  
  if (!task) {
    return next(
      new ErrorResponse(`Task not found with id of ${req.params.id}`, 404)
    );
  }
  
  // Make sure user is task owner
  const taskUserId = task.user._id ? task.user._id.toString() : task.user.toString();
  const currentUserId = req.user._id.toString();
  
  if (taskUserId !== currentUserId && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(`User ${currentUserId} is not authorized to access this task`, 401)
    );
  }
  
  res.status(200).json({
    success: true,
    data: task
  });
});

// @desc    Create new task
// @route   POST /api/v1/tasks
// @access  Private
exports.createTask = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.user = req.user._id;
  
  const task = await Task.create(req.body);
  
  res.status(201).json({
    success: true,
    data: task
  });
});

// @desc    Update task
// @route   PUT /api/v1/tasks/:id
// @access  Private
exports.updateTask = asyncHandler(async (req, res, next) => {
  let task = await Task.findById(req.params.id);
  
  if (!task) {
    return next(
      new ErrorResponse(`Task not found with id of ${req.params.id}`, 404)
    );
  }
  
  // Make sure user is task owner
  const taskUserId = task.user.toString();
  const currentUserId = req.user._id.toString();
  
  if (taskUserId !== currentUserId && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(`User ${currentUserId} is not authorized to update this task`, 401)
    );
  }
  
  task = await Task.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  
  res.status(200).json({
    success: true,
    data: task
  });
});

// @desc    Delete task
// @route   DELETE /api/v1/tasks/:id
// @access  Private
exports.deleteTask = asyncHandler(async (req, res, next) => {
  const task = await Task.findById(req.params.id);
  
  if (!task) {
    return next(
      new ErrorResponse(`Task not found with id of ${req.params.id}`, 404)
    );
  }
  
  // Make sure user is task owner
  const taskUserId = task.user.toString();
  const currentUserId = req.user._id.toString();
  
  if (taskUserId !== currentUserId && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(`User ${currentUserId} is not authorized to delete this task`, 401)
    );
  }
  
  await task.deleteOne();
  
  res.status(200).json({
    success: true,
    data: {}
  });
});