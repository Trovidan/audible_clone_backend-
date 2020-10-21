import jwt from 'jsonwebtoken';
import dotenv from "dotenv";
import User from './models/userSchema.js';

//utility config
dotenv.config({ silent: process.env.NODE_ENV === 'production' });
const SECRET_KEY = process.env.SECRET_KEY || 'q!w@e3R$t%y^u7*i(u)i*o_p+(efo*(3rqn s*y9q34n 309r389@939)(#$@#*U)#dasaha faq';


//token decoding function
const decodeJWT = (token, ip) => {
    let decoded;
    try {
        decoded = jwt.verify(token, SECRET_KEY);
    } catch (err) {
        decoded = {id: undefined };
    }
    return decoded;
}


const addToUserList = (fieldName, id, val) => {
    let update = { $push: {} };
    update.$push[fieldName] = {
        $each: [val]
    };
    let filter = {
        _id: id
    };
    return new Promise((resolve, reject) => {
        User.findOneAndUpdate(filter, update, (err, doc) => {
            if (err || doc === null) {
                console.log(err);
                console.log("error: ");
                reject(Error(false));
            }
            else {
                resolve(true);
            }
        });
    });
}

const removeFromUserList = (fieldName, id, val) => {
    let update = { $pull: {} };
    update.$pull[fieldName] = {
        $in: [val]
    };
    let filter = {
        _id: id
    };
    return new Promise((resolve, reject) => {
        User.findOneAndUpdate(filter, update, (err, doc) => {
            if (err || doc === null) {
                console.log(err);
                console.log("error: ");
                reject(Error(false));
            }
            else {
                resolve(true);
            }
        });
    });
}

const moveBetweenUserList = (fieldName, id, val, fromFieldName) => {
    let update = {
        $pull: {
            [fromFieldName]: {
                $in: [val]
            }
        },
        $push: {
            [fieldName]: {
                $each: [val]
            }
        }
    };
    let filter = {
        _id: id
    };
    console.log(update);
    return new Promise((resolve, reject) => {
        User.findOneAndUpdate(filter, update, (err, doc) => {
            if (err || doc === null) {
                console.log(err);
                console.log("error: ");
                reject(Error(false));
            }
            else {
                resolve(true);
            }
        });
    });
}


export {decodeJWT,addToUserList,moveBetweenUserList,removeFromUserList};