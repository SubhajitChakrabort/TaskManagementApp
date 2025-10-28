const ErrorResponse = require('../utils/errorResponse');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log to console for dev
  console.log(err.stack.red);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = `Resource not found`;
    error = new ErrorResponse(message, 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    // Extract the field name from the error
    const field = Object.keys(err.keyPattern)[0];
    let message = '';
    
    if (field === 'email') {
      message = 'Email already exists. Please use a different email.';
    } else if (field === 'phone') {
      message = 'Phone number already exists. Please use a different phone number.';
    } else if (field === 'title') {
      message = 'A task with this title already exists. Please use a different title.';
    } else {
      message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`;
    }
    
    error = new ErrorResponse(message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = new ErrorResponse(message, 400);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error'
  });
};

module.exports = errorHandler;
