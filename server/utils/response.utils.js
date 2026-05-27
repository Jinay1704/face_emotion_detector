/**
 * Standard API response helpers.
 * Every endpoint uses these so the client always gets a consistent shape.
 */

const sendSuccess = (res, statusCode, message, data) => {
  return res.status(statusCode).json({
    success: true,
    message: message || "OK",
    data:    data || null,
  });
};

const sendError = (res, statusCode, message, errors) => {
  return res.status(statusCode).json({
    success: false,
    message: message || "An error occurred",
    errors:  errors  || null,
  });
};

module.exports = { sendSuccess, sendError };
