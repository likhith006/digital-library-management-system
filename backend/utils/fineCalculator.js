import Setting from '../models/Setting.js';

export const calculateFine = async (dueDate, returnDate = new Date()) => {
  const settings = await Setting.findOne() || { finePerDay: 2 };
  const fineRate = settings.finePerDay || 2;

  const due = new Date(dueDate);
  const ret = new Date(returnDate);

  // Set hours to 0 to compare clean calendar dates
  due.setHours(0, 0, 0, 0);
  ret.setHours(0, 0, 0, 0);

  const diffTime = ret.getTime() - due.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 0) {
    return {
      overdueDays: diffDays,
      fineAmount: diffDays * fineRate,
    };
  }

  return {
    overdueDays: 0,
    fineAmount: 0,
  };
};
