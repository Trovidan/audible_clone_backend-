import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema({
  _id: mongoose.ObjectId,
  title: String,
  author: [String],
  narratedBy: [String],
  rating: Number,
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
  //_id => reviewID as Well as UserID
  reviews: [{_id: String, rating: Number, review: String}]
});

export default mongoose.model("Book",bookSchema);
