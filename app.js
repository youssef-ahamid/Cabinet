const express = require("express");
const app = express();

const dotenv = require("dotenv");
dotenv.config();

const bodyParser = require("body-parser");
app.use(bodyParser.json());

// app.use(express.static(path.join(__dirname + '../views')));
const path = require("path");
// Set EJS as templating engine
app.set("view engine", "ejs");

// app.engine('html', require('ejs').renderFile);
// app.set('view engine', 'html');
// app.set('views', `${__dirname}/views`);

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
mongoose.Promise = require("bluebird");
const url = process.env.MONGODB_CONNECT;
const connect = mongoose.connect(url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
// connect to the database
connect.then(
  () => {
    console.log("Connected to database: GridApp");
  },
  (err) => console.log(err)
);

/* 
    GridFs Configuration
*/
const GridFsStorage = require("multer-gridfs-storage");
const crypto = require("crypto");
// create storage engine
const storage = new GridFsStorage({
  url: process.env.MONGODB_CONNECT,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename = buf.toString("hex") + path.extname(file.originalname);
        const fileInfo = {
          filename,
          bucketName: "uploads",
        };
        resolve(fileInfo);
      });
    });
  },
});

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

const File = require("./models/File.js");
// index page
app.get("/", function (req, res) {
  let items = req.body.files || [];
  File.find({}).then((files) => {
    items = files || [];
    res.render("pages/fileUpload", { items });
  });
});

const multer = require("multer");
const upload = multer({ storage });
const fileRouter = require("./routes/file.js");
app.use("/files/", fileRouter(upload));

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Cabinet live on port ${PORT}`);
});
