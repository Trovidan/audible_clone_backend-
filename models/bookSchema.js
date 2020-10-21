import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema({
  _id: mongoose.ObjectId,
  title: String,
  author: [String],
  narratedBy: [String],
  rating: Number,
  totalReviewPoint: Number,
  totalReview: Number,
  genre: [String],
  category: String,
  imageUri: String,
  sampleUri: String,
  bookUri: String,
  price: Number,
  listenerCount: Number,
  arrivalDate: Date,
  length: Number,
  language: String,
  publisher:String,
  programType: String,
  reviews: [String]
});

export default mongoose.model("Book",bookSchema);
