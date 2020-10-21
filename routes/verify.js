import express from 'express';
import {decodeJWT} from '../utility.js';
import jwt from 'jsonwebtoken';
import Requestip from '@supercharge/request-ip';
import dotenv from 'dotenv';
import User from '../models/userSchema.js';
import nodemailer from 'nodemailer';

dotenv.config({silent: process.env.NODE_ENV === 'production'});
const verify = express.Router();
const SECRET_KEY = process.env.SECRET_KEY || 'q!w@e3R$t%y^u7*i(u)i*o_p+(';


verify.post('/mail', (req, res) => {
    let targetMail = req.body.sessionID;
    // console.log("Sending mail to: "+targetMail);
    if (targetMail === undefined) {
        res.status(406).send("please re-leogin, session expired");
        return;
    }

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.SERVER_MAIL_ADDRESS,
            pass: process.env.SERVER_MAIL_PASSWORD
        }
    });
    let token = jwt.sign({ id: req.body.sessionID }, SECRET_KEY, { expiresIn: '1h' });

    transporter.sendMail({
        from: `Team - Audible < ${process.env.SERVER_MAIL_ADDRESS}>`,
        to: targetMail,
        subject: "Audible-clone Account verification",
        html: `<div><a href='http://localhost:3000/verification/${token}'><h1>Click To verify your account</a></div>
      <p>Please verify your audible-clone account by visiting the above link.</p>`, // html body
    }).then(response => {
        console.log("sent");
        res.status(201).send("mailsent");
        return;
    }).catch(err => {
        console.log("unable to send")
        res.status(500).send("unable to send mail: " + err);
    })

});

verify.post('/account', (req, res) => {
    let decoded = decodeJWT(req.body.token);
    if (decoded.id === undefined) {
        res.status(409).send("Token expired!!!");
        return;
    }

    User.findOneAndUpdate({ _id: decoded.id }, { $set: { verified: true } }, (err, doc) => {
        if (err) {
            res.status(409).send("Token expired!!!");
            return;
        }
        else {
            let token = jwt.sign({ id: decoded.id, ip: Requestip.getClientIp(req) }, SECRET_KEY, { expiresIn: '1h' });
            res.status(201).send(token);
            return;
        }
    });
});

verify.get("/running", (req, res) => {
    res.status(200).send("Server is up and running and connected to :" + process.env.MONGO_DB_URL);
});

verify.get("/DBConnection", (req, res) => {
    Book.find({}, (err, data) => {
        if (err) {
            // console.log(err);
            res.status(274).send("Something Went Wrong!!! Can't connect to db");
            return;
        }
        else {
            // console.log(data);
            res.status(203).send(data);
            return;
        }
    });
})

export default verify;