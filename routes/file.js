const express = require("express");
const fileRouter = express.Router();
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();
const File = require("../models/File.js");
const path = require("path");
const fs = require("fs");
const mime = require("mime");
const Binary = require("../models/Binary.js");

module.exports = (upload) => {
  mongoose.connect(
    process.env.MONGODB_CONNECT,
    { useNewUrlParser: true, useUnifiedTopology: true },
    (err) => {
      console.log("mongoDB connected");
    }
  );
  /*
    POST: Upload & save a single file to the File collection
*/
  fileRouter.post("/", upload.single("file"), (req, res, next) => {
    const { caption, data, user, name } = req.body;
    const { filename } = req.file;

    if (!!req.file) {
      const ext = path.extname(filename);
      const binary = fs.readFileSync(
        path.join(__dirname, "..", "/public/uploads/" + filename)
      );
      let bin = new Binary({ binary });
      bin
        .save()
        .then((buf) => {
          const file = new File({
            filename: filename,
            name,
            caption,
            url: `/uploads/${filename}`,
            data: buf._id,
            contentType: mime.getType(ext),
            meta: data,
            user,
          });

          file
            .save()
            .then((data) => {
              console.log(data);
              buf.file = data._id;
              buf.save().then(() => res.redirect(`/files/${data._id}`));
            })
            .catch((err) => res.status(500).json(err));
        })
        .catch((err) => res.status(500).json(err));
    } else
      res.status(400).json({
        success: false,
        message: "No file sent in request",
      });
  });

  /*
    GET: Return all files
*/
  fileRouter.get("/all", (req, res, next) => {
    const baseURL = (req.secure? "https//": "http://") + req.get('host');
    
    File.find({})
      .then((items) => {
        res.render("pages/uploadedFiles", { baseURL, items });
      })
      .catch((err) => res.status(500).json(err));
  });

  /*
    GET: file upload page
*/
  fileRouter.get("/", (req, res, next) => {
    const baseURL = (req.secure? "https//": "http://") + req.get('host');
    res.render("pages/fileUpload", { baseURL });  
  });

  /*
    GET: Return a single file with a given ID
*/
  fileRouter.get("/:id", (req, res, next) => {
    const baseURL = (req.secure? "https//": "http://") + req.get('host');

    File.findOne({ _id: req.params.id })
      .populate("data")
      .then((file) => {
        res.render("pages/viewFile", { file, baseURL });
      })
      .catch((err) => res.status(500).json(err));
  });

  /*
    DEL: Delete a File from the collection
*/
  fileRouter.delete("/:id", (req, res, next) => {
    File.findById(req.params.id)
      .then((file) => {
        if (file) {
          let filePath = path.join(__dirname, "..", "/public/uploads/" + file.filename)
          fs.unlinkSync(filePath)
          File.findByIdAndDelete(req.params.id)
            .then(() => {
              Binary.findByIdAndDelete(file.data).then(() => {
                  res.status(200).json({
                    success: true,
                    message: `File with ID ${req.params.id} has been deleted`,
                  });
                }).catch((err) => res.status(500).json(err));
            }).catch((err) => res.status(500).json(err));
        } else {
          res.status(200).json({
            success: false,
            message: `File with ID: ${req.params.id} not found`,
          });
        }
      })
      .catch((err) => res.status(500).json(err));
  });

  /*
    GET: Fetch most recently added record
*/
  fileRouter.get("/recent", (req, res, next) => {
    File.findOne({}, {}, { sort: { _id: -1 } })
      .then((file) => {
        res.status(200).json({
          success: true,
          file,
        });
      })
      .catch((err) => res.status(500).json(err));
  });

  /*
    POST: Upload multiple files upto 3
*/
  fileRouter.post("/multiple", upload.array("file", 3), (req, res, next) => {
    res.status(200).json({
      success: true,
      message: `${req.files.length} files uploaded successfully`,
    });
  });

  /*
    GET: Fetches a particular file by filename
*/
  fileRouter.get("/:filename", (req, res, next) => {
    File.find({ filename: req.params.filename }).then((files) => {
      if (!files[0] || files.length === 0) {
        return res.status(200).json({
          success: false,
          message: "No files available",
        });
      }

      res.status(200).json({
        success: true,
        file: files[0],
      });
    });
  });

  return fileRouter;
};
