import mongoose from 'mongoose';

const reservationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: true,
    },
    reservationDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'CANCELLED', 'COMPLETED'],
      default: 'PENDING',
    },
    expiryDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const Reservation = mongoose.model('Reservation', reservationSchema);
export default Reservation;
