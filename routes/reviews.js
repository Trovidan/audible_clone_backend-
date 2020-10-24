import express from 'express';
import Requestip from '@supercharge/request-ip';
import { decodeJWT } from '../utility.js';
import Book from '../models/bookSchema.js';
import User from '../models/userSchema.js';
import Review from '../models/reviewSchema.js';

const reviews= express.Router();
reviews.use(express.json());

reviews.post("/add", (req, res) => {
    //console.log("Started adding review");
    let decoded = decodeJWT(req.body.sessionID, Requestip.getClientIp(req));
    if (decoded.id === undefined) {
        res.status(401).send("Session Expired!");
        return;
    }
    let { bookID, title, rating, body,userName } = req.body;
    if (title === undefined || rating === undefined || body === undefined || userName===undefined) {
        res.status(400).send("invalid review, missing content");
        return;
    }
    let filter = {
        _id: decoded.id,
        library: bookID
    };
    User.find(filter, '_id', (err, docs) => {
        if (err || docs.length === 0) {
            console.log(err);
            res.status(400).send("invalid review, unable to find file");
            return;
        }
        let newReview = {
            _id: (bookID + decoded.id),
            book_id: bookID,
            user_id: decoded.id,
            user_name: userName,
            title: title,
            rating: rating,
            body: body
        };

        Review.create(newReview, (err) => {
            if (err) {
                console.log(err);
                res.status(200).send("Review already exists");
                return;
            }
            let update = {
                $push: {
                    reviews: [newReview._id]
                }
            }
            User.findOneAndUpdate(filter, update, (err, doc) => {
                if (err) {
                    //TODO add roll back
                    res.status(502).send("Unable to add user review");
                    return;
                }
                //TODO add rating updation
                update['$inc'] = {
                    'totalReviewPoint': rating,
                    'totalReview': 1
                };
                Book.findOneAndUpdate({ _id: bookID }, update, (err, doc) => {
                    if (err) {
                        //TODO add roll back
                        res.status(502).send("Unable to add book review");
                        return;
                    }
                    let newRating = (doc.totalReviewPoint + rating) / (doc.totalReview + 1);
                    Book.findOneAndUpdate({ _id: bookID }, { $set: { rating: newRating } }, (err, doc) => {
                        if (err) {
                            res.status(502).send("Unable to update book rating");
                            return;
                        }
                        res.status(201).send("Added review");
                        return;
                    });
                });
            });
        })
    });
});

reviews.post('/delete', (req, res) => {
    //console.log("Started removing review");
    let decoded = decodeJWT(req.body.sessionID, Requestip.getClientIp(req));
    if (decoded.id === undefined) {
        res.status(401).send("Session Expired!");
        return;
    }
    let { bookID, rating } = req.body;
    if (bookID === undefined || rating === undefined) {
        res.status(400).send("invalid delete request, missing details");
        return;
    }
    let reviewID = bookID + decoded.id;
    let filter = {
        _id: reviewID,
        user_id: decoded.id,
        book_id: bookID,
        rating: rating
    };
    Review.deleteOne(filter, (err, result) => {
        //console.log(result);
        if (err || result.n === 0) {
            res.status(400).send("invalid delete request");
            return;
        }

        User.findOneAndUpdate({ _id: decoded.id }, { $pull: { 'reviews': { $in: [reviewID] } } }, (err, doc) => {
            if (err || doc === null) {
                //TODO add roll back
                res.status(501).send("unable to remove user & book review");
                return;
            }
            Book.findOneAndUpdate({ _id: bookID }, { $pull: { 'reviews': { $in: [reviewID] } }, $inc: { 'totalReviewPoint': -rating, 'totalReview': -1 } }, { new: true }, (err, doc) => {
                if (err || doc === null) {
                    //TODO add roll back
                    res.status(501).send("unable to remove book review");
                    return;
                }
                let newRating = doc.totalReview === 0 ? 0 : doc.totalReviewPoint / doc.totalReview;
                Book.findOneAndUpdate({ _id: bookID }, { $set: { 'rating': newRating } }, (err, doc) => {
                    if (err || doc === null) {
                        //TODO add roll back
                        console.log(err);
                        console.log(doc);
                        res.status(501).send("unable to update rating");
                        return;
                    }
                    res.status(201).send("Deleted the review");
                    return;
                });
            });
        })
    });
});

reviews.post('/fetch',(req,res)=>{
    let {reviews,skip,limit,sort} = req.body;
    skip= skip===undefined?0:skip;
    limit= limit ===undefined?12:limit;
    sort= sort===undefined?'-rating':sort;
    if(!Array.isArray(reviews)){
        res.status(400).send("Improper reviewID");
        return;
    }
    console.log(reviews);
    Review.find({_id: {$in:reviews}},{},{sort:sort,limit: limit, skip:skip},(err,docs)=>{
        if(err){
            console.log(err);
            res.status(502).send("unable to fetch reviews");
            return;
        }
        res.status(200).send(docs);
        return;
    });
});
export default reviews;