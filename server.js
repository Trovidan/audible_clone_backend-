import dotenv from "dotenv";
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import nodemailer from 'nodemailer';
import Requestip from '@supercharge/request-ip';
import Book from './bookSchema.js';
import User from './userSchema.js';
import jwt from 'jsonwebtoken';
//appConfig
dotenv.config({ silent: process.env.NODE_ENV === 'production' });
const app = express();
const port = process.env.PORT || 9000;
const SECRET_KEY = process.env.SECRET_KEY || 'q!w@e3R$t%y^u7*i(u)i*o_p+(';
var sessions = new Object();
//middleWare
app.use(express.json());
app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors({ credentials: true, origin: "https://audible-clone.netlify.app"}));

//dbConfig
mongoose.set('useFindAndModify', false);
mongoose.connect(process.env.MONGO_DB_URL,  {
  useCreateIndex:true,
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {console.log("Connected to database");});

//apiRoutes
const decodeJWT=(token,ip)=>{
  let decoded;
  try {
    decoded = jwt.verify(token, SECRET_KEY);
  } catch (err) {
    decoded = { sessionID: undefined };
  }
  return decoded;
}

const addToDB = (fieldName, id, val) => {
  let update = { $push: {}};
  update.$push[fieldName] = {
    $each: [val]
  };
  let filter = {
    _id: id
  };
  return new Promise((resolve,reject)=>{
    User.findOneAndUpdate(filter, update, (err, doc) => {
      if (err || doc===null) {
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

const removeFromDB = (fieldName, id, val) => {
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

const moveDB = (fieldName, id, val,fromFieldName) => {
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

app.post('/getList', (req, res) => {
  console.log("called getlist");
  let decoded = decodeJWT(req.body.sessionID, Requestip.getClientIp(req));
  console.log(decoded);
  let sessionID = decoded.sessionID;
  console.log(sessions[sessionID]);
  if (sessionID === undefined || sessions[sessionID] === undefined) {
    res.status(409).res("Session Expired!");
    return;
  }
  User.findById(sessions[sessionID], "library wishlist cart", (err, doc) => {
    if (err) {
      res.status(405).res("Invalid Account!");
      return;
    }
    res.status(200).send(doc);
    return;
  });
});

app.post("/checkSession", (req, res) => {

  console.log("called checksession");
  let decoded = decodeJWT(req.body.sessionID, Requestip.getClientIp(req));
  let sessionID = decoded.sessionID;
  // console.log(sessionID);
  if (sessionID === undefined || sessions[sessionID] === undefined) {
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

app.post("/updateRecord", (req, res) => {
  console.log("called Update Record");
  let decoded = decodeJWT(req.cookies.sessionID, Requestip.getClientIp(req));
  let sessionID = decoded.sessionID;
  let {fieldName, val, fromFieldName, type } = req.body;
  let id = sessions[sessionID]===undefined?undefined:sessions[sessionID];

  if(id===undefined || val===undefined || fieldName===undefined || (type===undefined && fromFieldName===undefined) ){
    res.status(405).send("Invalid Request!");
    return;
  }
  if(fromFieldName !== undefined){
    console.log("moving to wishlist");
    moveDB(fieldName,id,val, fromFieldName).then(response => {
      res.status(201).send("added to "+fieldName+ " from "+fromFieldName);
      return;
    }).catch(err=>{
      res.send(500).send("unable to make changes!!");
    });
  }
  else if(type === 1){
    addToDB(fieldName, id, val).then(response => {
      res.status(201).send("added to " + fieldName);
      return;
    }).catch(err => {
      res.send(500).send("unable to make changes!!");
    });
  }
  else{
    removeFromDB(fieldName, id, val).then(response => {
      res.status(201).send("removed from " + fieldName);
      return;
    }).catch(err => {
      res.send(500).send("unable to make changes!!");
    });
  }
});

app.post("/books",(req,res) => {
  let {languages,categories,programTypes,genres,ids} = req.body;
  let filter={};
  // console.log(req.body);
  const addFilter = (fieldOptions, fieldName, type)=>{
    let temp=[];
    if (Array.isArray(fieldOptions)) {
      fieldOptions.map(field => {
        if (field.selected === true) {
          temp.push(field.title);
        }
      });
      
      if (temp.length > 0 ) {
        // console.log(temp);
        if(type===1){
          filter[fieldName] = {
            $in: temp
          };
        }
        else if (type === 2){
          filter.genre = {
            $all: temp
          };
        }
      }
    }
  }

  addFilter(languages,"language",1);
  addFilter(categories,"category",1);
  addFilter(programTypes,"programType",1);
  addFilter(genres,"genre",2);
  if(Array.isArray(ids) && ids.length>0){
    filter["_id"] = {
      $in: ids
    };
  }

  // console.log(filter);
  Book.find(filter,(err, data) => {
    if(err){
      // console.log(err);
      res.status(404).send("Something Went Wrong!!!");
      return;
    }
    else{
      // console.log(data);
      res.status(203).send(data);
      return;
    }
  });

});

app.post("/login", (req,res) =>{
  let sessionID = "123456asdfgh2345";
  let {email,password} = req.body;

  email = email===undefined? "":email;
  password = password===undefined?"":password;

  // console.log(email);

  User.findById( email , (err, doc) => {
    // console.log(doc);
    if (err) {
      res.status(503).send("Unable to verify your details. Please retry later!");
      return;
    }
    else if (doc === null) {
      res.status(404).send("We can not find any account with entered email.");
      return;
    }
    else if(doc.password == password) {
      sessionID = sessionID + email;
      let verified = doc.verified; 
      sessions[sessionID] = doc._id;
      // console.log("creating session with session ID "+sessionID);
      if(verified){
        let token = jwt.sign({ sessionID: sessionID, ip: Requestip.getClientIp(req) }, SECRET_KEY, { expiresIn: '1h' });
        res.status(200).send({ sessionID: token, verified: true });
      }else{
        res.status(200).send({sessionID: sessionID, verified: false});
      }
      return;
    }
    else {
      res.status(402).send("The entered password does not match with the e-mail.");
      return;
    }
  }); 
  
});

app.post("/createAccount", (req, res) => {
  // console.log(req.body);
  let sessionID = "123456asdfgh2345";
  let {email,name,password} = req.body;

  if (name === undefined || name === "" || email === "" || email === undefined || password === "" || password === undefined){
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
  User.create(newUser,(err) =>{
    if(err){
      res.status(409).send("Account with this Email already exists! please try to login.");
      return;
    }
    sessionID = sessionID + email;
    sessions[sessionID] = email;
    res.status(202).send({ sessionID: sessionID, verified: false });
    return;
  });
  
});

app.post("/personelDetails", (req, res) => {
  console.log("called personel details");
  //Will handle every personel details except reviews
  let decoded = decodeJWT(req.cookies.sessionID, Requestip.getClientIp(req));
  let id = sessions[decoded.sessionID];
  let projection = req.body.projection;

  if(id === undefined){
    res.status(401).send("Cann't validate the session! please re-login");
    return;
  }
  
  projection = projection===undefined? "":projection;

  User.findById(id,projection, (err,doc)=>{
    if(err){
      res.status(401).send("Cann't validate the session! please re-login");
      return;
    }
    // console.log("user details");
    // console.log(doc);
    res.status(200).send(doc);
  });

});

app.post('/verifyMail',(req,res)=>{

  let targetMail = sessions[req.body.sessionID];
  // console.log("Sending mail to: "+targetMail);
  if(targetMail===undefined){
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
  let token = jwt.sign({sessionID: req.body.sessionID}, SECRET_KEY,{expiresIn: '1h'});

  transporter.sendMail({
    from: `Team - Audible < ${process.env.SERVER_MAIL_ADDRESS}>`, 
    to: targetMail, 
    subject: "Audible-clone Account verification",
    html: `<div><a href='http://localhost:3000/verification/${token}'><h1>Click To verify your account</a></div>
      <p>Please verify your audible-clone account by visiting the above link.</p>`, // html body
  }).then(response=>{
    console.log("sent");
    res.status(201).send("mailsent");
    return;
  }).catch(err=>{
    console.log("unable to send")
    res.status(500).send("unable to send mail: " + err);
  })
  
});

app.post('/verifyAccount',(req,res)=>{
  let decoded = decodeJWT(req.body.token);
  let sessionID = decoded.sessionID;
  if(sessionID===undefined || sessions[sessionID]===undefined){
    res.status(409).send("Token expired!!!");
    return;
  }

  User.findOneAndUpdate({_id: sessions[sessionID]},{$set: {verified: true}},(err,doc)=>{
    if(err){
      res.status(409).send("Token expired!!!");
      return;
    }
    else{
      let token = jwt.sign({sessionID: sessionID, ip: Requestip.getClientIp(req)},SECRET_KEY,{expiresIn: '1h'});
      res.status(201).send(token);
      return;
    }
  });
});
//default routing

app.get("/isRunning",(req,res)=>{
  res.status(200).send("Server is up and running and connected to :" + process.env.MONGO_DB_URL);
});

app.get("/verifyDBConnection",(req,res)=>{
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
app.post("*", (req, res) => {
  res.status(404).send("Invalid URL");
});

app.get("*", (req,res) => {
  res.status(404).send("Invalid URL");
});
//appListening
app.listen(port, () => {
  console.log('listening on: '+ port);
});

