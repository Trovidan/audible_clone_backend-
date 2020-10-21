import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: String,
  _id: String,
  password: String,
  wishlist: [mongoose.ObjectId],
  library: [mongoose.ObjectId],
  cart: [mongoose.ObjectId],
  verified: Boolean,
  reviews: [String],
});

export default mongoose.model('User',userSchema);
