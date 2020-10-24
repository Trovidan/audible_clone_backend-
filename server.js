import dotenv from "dotenv";
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import books from './routes/books.js';
import users from './routes/users.js';
import signup from './routes/signup.js';
import verify from "./routes/verify.js";
import reviews from "./routes/reviews.js";

//appConfig 
dotenv.config({ silent: process.env.NODE_ENV === 'production' });
const app = express();
const port = process.env.PORT || 9000;


//middleWare
app.use(express.json());
app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors({ credentials: true, origin: "*"}));

//dbConfig
mongoose.set('useFindAndModify', false);
mongoose.connect(process.env.MONGO_DB_URL,  {
  useCreateIndex:true,
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {console.log("Connected to database");});

//apiRoutes
app.use("/books", books);
app.use("/user", users);
app.use("/signup", signup);
app.use("/verify",verify);
app.use("/review",reviews);
//default routing
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

