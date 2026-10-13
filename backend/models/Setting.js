import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema(
  {
    finePerDay: {
      type: Number,
      default: 2,
    },
    studentMaxBooks: {
      type: Number,
      default: 3,
    },
    studentIssueDays: {
      type: Number,
      default: 14,
    },
    facultyMaxBooks: {
      type: Number,
      default: 6,
    },
    facultyIssueDays: {
      type: Number,
      default: 30,
    },
    collegeName: {
      type: String,
      default: 'Apex Institute of Technology & Management',
    },
  },
  {
    timestamps: true,
  }
);

const Setting = mongoose.model('Setting', settingSchema);
export default Setting;
