const mongoose = require('mongoose');

const depositSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userName: {
      type: String,
      required: true,
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
    paymentMethod: {
      type: String,
      enum: ['cash', 'bkash', 'nagad', 'bank', 'other'],
      default: 'cash',
    },
    note: {
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
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'approved',
    },
  },
  {
    timestamps: true,
  }
);


// Index for faster queries
depositSchema.index({ userId: 1, month: 1 });
depositSchema.index({ month: 1, isLocked: 1 });

module.exports = mongoose.model('Deposit', depositSchema);
