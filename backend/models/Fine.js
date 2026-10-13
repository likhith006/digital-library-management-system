import mongoose from 'mongoose';

const fineSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    issueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Issue',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      default: 'Late return overdue fine',
    },
    status: {
      type: String,
      enum: ['UNPAID', 'PAID', 'WAIVED'],
      default: 'UNPAID',
    },
    paidDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Fine = mongoose.model('Fine', fineSchema);
export default Fine;
