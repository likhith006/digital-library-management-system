import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Book title is required'],
      trim: true,
    },
    author: {
      type: String,
      required: [true, 'Author name is required'],
      trim: true,
    },
    ISBN: {
      type: String,
      required: [true, 'ISBN is required'],
      unique: true,
      trim: true,
    },
    publisher: {
      type: String,
      default: 'Academic Press',
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    department: {
      type: String,
      default: 'General Engineering',
      trim: true,
    },
    description: {
      type: String,
      default: 'Comprehensive academic textbook and reference resource for college curriculum.',
    },
    coverImage: {
      type: String,
      default: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80',
    },
    totalCopies: {
      type: Number,
      required: true,
      min: [1, 'Total copies must be at least 1'],
      default: 5,
    },
    availableCopies: {
      type: Number,
      required: true,
      min: [0, 'Available copies cannot be negative'],
      default: 5,
    },
    shelfNumber: {
      type: String,
      default: 'A-12',
    },
    rackNumber: {
      type: String,
      default: 'R-04',
    },
    publicationYear: {
      type: Number,
      default: 2023,
    },
    language: {
      type: String,
      default: 'English',
    },
    format: {
      type: String,
      enum: ['PHYSICAL', 'DIGITAL', 'BOTH'],
      default: 'PHYSICAL',
    },
    digitalFile: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Search Index helper or text indexes
bookSchema.index({ title: 'text', author: 'text', ISBN: 'text', category: 'text', publisher: 'text' });

const Book = mongoose.model('Book', bookSchema);
export default Book;
