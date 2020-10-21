import express from 'express';
import User from '../models/userSchema.js';
import Requestip from '@supercharge/request-ip';
import { decodeJWT, addToUserList, removeFromUserList, moveBetweenUserList } from '../utility.js';
const users = express.Router();
var decoded;
users.all('*',(req,res,next)=>{
    decoded = decodeJWT(req.body.sessionID, Requestip.getClientIp(req));
    next();
});

users.post('/getList', (req, res) => {
    //console.log("called getlist");
    if (decoded.id === undefined) {
        res.status(409).res("Session Expired!");
        return;
    }
    User.findById(decoded.id, "library wishlist cart", (err, doc) => {
        if (err) {
            res.status(405).send("Invalid Account!");
            return ;
        }
        res.status(200).send(doc);
        return;
    });
});

users.post("/updateRecord", (req, res) => {
    //console.log("called Update Record");
    let { fieldName, val, fromFieldName, type } = req.body;
    let id = decoded.id === undefined ? undefined : decoded.id;

    if (id === undefined || val === undefined || fieldName === undefined || (type === undefined && fromFieldName === undefined)) {
        res.status(405).send("Invalid Request!");
        return;
    }
    if (fromFieldName !== undefined) {
        //console.log("moving to wishlist");
        moveBetweenUserList(fieldName, id, val, fromFieldName).then(response => {
            res.status(201).send("added to " + fieldName + " from " + fromFieldName);
            return;
        }).catch(err => {
            res.send(500).send("unable to make changes!!");
        });
    }
    else if (type === 1) {
        addToUserList(fieldName, id, val).then(response => {
            res.status(201).send("added to " + fieldName);
            return;
        }).catch(err => {
            res.send(500).send("unable to make changes!!");
        });
    }
    else {
        removeFromUserList(fieldName, id, val).then(response => {
            res.status(201).send("removed from " + fieldName);
            return;
        }).catch(err => {
            res.send(500).send("unable to make changes!!");
        });
    }
});

users.post("/details", (req, res) => {
    //console.log("called personel details");
    //Will handle every personel details except reviews
    let id = decoded.id;
    let projection = req.body.projection;

    if (id === undefined) {
        res.status(401).send("Cann't validate the session! please re-login");
        return;
    }

    projection = projection === undefined ? "" : projection;

    User.findById(id, projection, (err, doc) => {
        if (err) {
            res.status(401).send("Cann't validate the session! please re-login");
            return;
        }
        //console.log("user details");
        //console.log(doc);
        res.status(200).send(doc);
    });

});


export default users;