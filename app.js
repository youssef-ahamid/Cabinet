const express = require("express");
const app = express();

const dotenv = require("dotenv");
dotenv.config();

const bodyParser = require("body-parser");
app.use(bodyParser.json());

const path = require("path");
app.use(express.static(path.join(__dirname, 'public')));
// Set EJS as templating engine
app.set("view engine", "ejs");

const cors = require("cors");
app.use(
  cors({
    origin: "*",
  })
);

const logger = require("morgan");
app.use(logger("dev"));

const cookieParser = require("cookie-parser");
app.use(cookieParser());

const methodOverride = require("method-override");
app.use(methodOverride("_method"));

const mongoose = require("mongoose");
mongoose.connect(process.env.MONGODB_CONNECT,
    { useNewUrlParser: true, useUnifiedTopology: true }, err => {
        console.log('mongoDB connected')
    });
/* 
    GridFs Configuration
*/


// headers
app.use(function (req, res, next) {
  res.setHeader("crossorigin", "anonymous");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );
  next();
});
 
var multer = require('multer');
 
var storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads')
    },
    filename: (req, file, cb) => {
        cb(null, encodeURI(Date.now() + "-" + file.originalname))
    },
});

var upload = multer({ storage });
const fileRouter = require("./routes/file.js");
app.use("/files/", fileRouter(upload));

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Cabinet live on port ${PORT}`);
});
