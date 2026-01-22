const mongoose = require('mongoose');

const monthlyReportSchema = new mongoose.Schema(
  {
    month: {
      type: String,
      required: true,
      unique: true,
      // Format: 'YYYY-MM'
    },
    year: {
      type: Number,
      required: true,
    },
    monthName: {
      type: String,
      required: true,
    },
    totalMeals: {
      type: Number,
      required: true,
      default: 0,
    },
    totalExpenses: {
      type: Number,
      required: true,
      default: 0,
    },
    costPerMeal: {
      type: Number,
      required: true,
      default: 0,
    },
    expenseBreakdown: {
      grocery: { type: Number, default: 0 },
      electricity: { type: Number, default: 0 },
      gas: { type: Number, default: 0 },
      water: { type: Number, default: 0 },
      cleaning: { type: Number, default: 0 },
      other: { type: Number, default: 0 },
    },
    userReports: [
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
        breakfastCount: {
          type: Number,
          default: 0,
        },
        lunchCount: {
          type: Number,
          default: 0,
        },
        dinnerCount: {
          type: Number,
          default: 0,
        },
        guestMeals: {
          type: Number,
          default: 0,
        },
        totalMeals: {
          type: Number,
          default: 0,
        },
        amountDue: {
          type: Number,
          default: 0,
        },
        totalDeposits: {
          type: Number,
          default: 0,
        },
        balance: {
          type: Number,
          default: 0,
        },
      },
    ],
    pdfUrl: {
      type: String,
      default: '',
    },
    closedAt: {
      type: Date,
      required: true,
    },
    closedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isLocked: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
monthlyReportSchema.index({ year: 1 });

module.exports = mongoose.model('MonthlyReport', monthlyReportSchema);
