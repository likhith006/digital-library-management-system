import mongoose from 'mongoose';

const digitalResourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Resource title is required'],
      trim: true,
    },
    author: {
      type: String,
      default: 'College Faculty / Department',
      trim: true,
    },
    category: {
      type: String,
      enum: ['PDF', 'STUDY_MATERIAL', 'NOTES', 'QUESTION_PAPER', 'JOURNAL', 'REFERENCE'],
      default: 'PDF',
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    subject: {
      type: String,
      default: 'General Core',
      trim: true,
    },
    semester: {
      type: String,
      default: 'Semester 1',
    },
    description: {
      type: String,
      default: 'Curriculum-aligned digital resource available for viewing and download.',
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL or path is required'],
    },
    fileSize: {
      type: String,
      default: '4.2 MB',
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    downloadsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const DigitalResource = mongoose.model('DigitalResource', digitalResourceSchema);
export default DigitalResource;
