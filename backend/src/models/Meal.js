const mongoose = require('mongoose');

const mealSchema = new mongoose.Schema(
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
    date: {
      type: Date,
      required: [true, 'Please provide a date'],
    },
    mealType: {
      type: String,
      enum: ['breakfast', 'lunch', 'dinner'],
      required: [true, 'Please specify meal type'],
    },
    guestCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    month: {
      type: String,
      required: true,
      // Format: 'YYYY-MM'
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
mealSchema.index({ userId: 1, month: 1 });
mealSchema.index({ date: 1 });
mealSchema.index({ month: 1, isLocked: 1 });

module.exports = mongoose.model('Meal', mealSchema);
