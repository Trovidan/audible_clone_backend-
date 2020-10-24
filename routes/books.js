import express from 'express';
import Book from '../models/bookSchema.js';

const books=express.Router();

books.post("/", (req, res) => {
    // console.log("fetching books");
    let { languages, categories, programTypes,projection,sortby,limit,skip, genres, ids } = req.body;
    let filter = {};
    sortby = sortby===undefined?'-rating':sortby;
    limit = limit===undefined?12:limit;
    skip = skip===undefined?0:skip;
    projection = projection===undefined?"":projection;
    // console.log(req.body);
    const addFilter = (fieldOptions, fieldName, type) => {
        let temp =  [];
        if (Array.isArray(fieldOptions)) {
            fieldOptions.map(field => {
                if (field.selected === true) {
                    temp.push(field.title);
                }
            });

            if (temp.length > 0) {
                // console.log(temp);
                if (type === 1) {
                    filter[fieldName] = {
                        $in: temp
                    };
                }
                else if (type === 2) {
                    filter.genre = {
                        $all: temp
                    };
                }
            }
        }
    }

    addFilter(languages, "language", 1);
    addFilter(categories, "category", 1);
    addFilter(programTypes, "programType", 1);
    addFilter(genres, "genre", 2);
    if (Array.isArray(ids) && ids.length > 0) {
        filter["_id"] = {
            $in: ids
        };
    }
    // console.log(filter);
    Book.find(filter,projection,{sort: sortby,limit: limit,skip: skip},(err, data) => {
        if (err) {
            // console.log(err);
            res.status(404).send("Something Went Wrong!!!");
            return;
        }
        else {
            // console.log(data);
            res.status(203).send(data);
            return;
        }
    });

});

export default books;