const jwt = require('jsonwebtoken');

// Generate JWT token
exports.generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Format date to YYYY-MM
exports.getMonthString = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

// Get month name from month string
exports.getMonthName = (monthString) => {
  const [year, month] = monthString.split('-');
  const date = new Date(year, parseInt(month) - 1);
  return date.toLocaleString('en-US', { month: 'long' });
};

// Format currency
exports.formatCurrency = (amount) => {
  return `৳${amount.toFixed(2)}`;
};

// Check if month is current or future
exports.isCurrentOrFutureMonth = (monthString) => {
  const currentMonth = exports.getMonthString(new Date());
  return monthString >= currentMonth;
};

// Validate month format
exports.isValidMonthFormat = (monthString) => {
  const regex = /^\d{4}-(0[1-9]|1[0-2])$/;
  return regex.test(monthString);
};
