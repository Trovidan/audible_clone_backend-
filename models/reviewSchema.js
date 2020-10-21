import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
    _id: String,
    user_id: String,
    book_id: mongoose.ObjectId,
    rating: Number,
    title: String,
    body: String
});

export default mongoose.model('Review',reviewSchema);