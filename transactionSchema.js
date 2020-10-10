import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  userID: String,
  bookID: String,
  _id: String,
  date: Date,
  method: String
});

export default mongoose.model("transaction",transactionSchema);
