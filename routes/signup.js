import express from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import Requestip from '@supercharge/request-ip';
import {decodeJWT} from '../utility.js';
import User from '../models/userSchema.js';

dotenv.config({silent: process.env.NODE_ENV === 'production'});

const SECRET_KEY = process.env.SECRET_KEY || 'q!w@e3R$t%y^u7*i(u)i*o_p+(';
const signup = express.Router();


signup.post("/checkSession", (req, res) => {

    //console.log("called checksession");
    let decoded = decodeJWT(req.body.sessionID, Requestip.getClientIp(req));
    
    //console.log(decoded);
    if (decoded.id === undefined ){
        // console.log("Sent checkSession status false");
        res.status(200).send({ status: false });
        return;
    }
    else {
        // console.log("Sent checkSession status true");
        res.status(200).send({ status: true });
        return;
    }
});

signup.post("/login", (req, res) => {
    let { email, password } = req.body;

    email = email === undefined ? "" : email;
    password = password === undefined ? "" : password;

    // console.log(email);

    User.findById(email, (err, doc) => {
        // console.log(doc);
        if (err) {
            res.status(503).send("Unable to verify your details. Please retry later!");
            return;
        }
        else if (doc === null) {
            res.status(404).send("We can not find any account with entered email.");
            return;
        }
        else if (doc.password == password) {
            let verified = doc.verified;
            // console.log("creating session with session ID "+sessionID);
            if (verified) {
                let token = jwt.sign({id: email, ip: Requestip.getClientIp(req) }, SECRET_KEY, { expiresIn: '1h' });
                res.status(200).send({ sessionID: token, verified: true });
            } else {
                res.status(200).send({ sessionID: email, verified: false });
            }
            return;
        }
        else {
            res.status(402).send("The entered password does not match with the e-mail.");
            return;
        }
    });

});

signup.post("/createAccount", (req, res) => {
    // console.log(req.body);
    let sessionID = "123456asdfgh2345";
    let { email, name, password } = req.body;

    if (name === undefined || name === "" || email === "" || email === undefined || password === "" || password === undefined) {
        // console.log(name);
        // console.log(email);
        // console.log(password);
        res.status(406).send("Entered credential are invalid please try again!");
        return;
    }

    let newUser = {
        name: name,
        _id: email,
        password: password,
        favourite: [],
        listened: [],
        reviews: []
    }
    User.create(newUser, (err) => {
        if (err) {
            res.status(409).send("Account with this Email already exists! please try to login.");
            return;
        }
        sessionID = sessionID + email;
        res.status(202).send({ sessionID: email, verified: false });
        return;
    });

});

export default signup;