const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: ['grocery', 'electricity', 'gas', 'water', 'cleaning', 'other'],
      required: [true, 'Please specify expense category'],
    },
    amount: {
      type: Number,
      required: [true, 'Please provide an amount'],
      min: 0,
    },
    date: {
      type: Date,
      required: [true, 'Please provide a date'],
    },
    month: {
      type: String,
      required: true,
      // Format: 'YYYY-MM'
    },
    description: {
      type: String,
      required: [true, 'Please provide a description'],
      trim: true,
    },
    receiptImage: {
      type: String,
      default: '',
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
expenseSchema.index({ month: 1, isLocked: 1 });
expenseSchema.index({ category: 1, month: 1 });

module.exports = mongoose.model('Expense', expenseSchema);
