const express = require("express");
const fileRouter = express.Router();
const mongoose = require("mongoose");
const File = require("../models/File.js");

module.exports = (upload) => {
  const url = process.env.MONGODB_CONNECT;
  const connect = mongoose.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  let gfs;

  connect.then("open", () => {
    // initialize stream
    gfs = new mongoose.mongo.GridFSBucket(connect.db, {
      bucketName: "uploads",
    });
  });

  /*
    POST: Upload & save a single file to the File collection
*/
  fileRouter.post("/", upload.single("file"), (req, res, next) => {
    const { caption, contentType, data, user } = req.body;

    if (!!req.file)
      File.findOne({ fileId: req.file.id }) // check for existing files
        .then((foundFile) => {
          console.log(foundFile);
          if (foundFile) {
            return res.status(200).json({
              success: false,
              message: "File already exists",
            });
          }

          let newFile = new File({
            filename: req.file.filename,
            fileId: req.file.id,
            meta: data,
            contentType,
            caption,
            user,
          });
          console.log(newFile);

          newFile
            .save()
            .then((f) => {
              console.log(f);
              f.save().then((file) => {
                res.status(200).json({
                  success: true,
                  file,
                });
              });
            })
            .catch((err) => res.status(500).json(err));
        })
        .catch((err) => res.status(500).json(err));
    else
      res.status(400).json({
        success: false,
        message: "No file sent in request",
      });
  });

  /*
    GET: Return all files
*/
  fileRouter.get("/", (req, res, next) => {
    File.find({})
      .then((files) => {
        res.status(200).json({
          success: true,
          files,
        });
      })
      .catch((err) => res.status(500).json(err));
  });

  /*
    GET: Return a single file with a given ID
*/
  fileRouter.get("/:id", (req, res, next) => {
    File.findOne({ _id: req.params.id })
      .then((file) => {
        res.status(200).json({
          success: true,
          file,
        });
      })
      .catch((err) => res.status(500).json(err));
  });

  /*
    DEL: Delete a File from the collection
*/
  fileRouter.delete("/:id", (req, res, next) => {
    File.findOne({ _id: req.params.id })
      .then((file) => {
        if (file) {
          File.deleteOne({ _id: req.params.id })
            .then(() => {
              gfs.delete(
                new mongoose.Types.ObjectId(req.params.id),
                (err, data) => {
                  if (err) {
                    return res.status(404).json({ err: err });
                  }

                  res.status(200).json({
                    success: true,
                    message: `File with ID ${req.params.id} is deleted`,
                  });
                }
              );
            })
            .catch((err) => {
              return res.status(500).json(err);
            });
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
    gfs.find({ filename: req.params.filename }).toArray((err, files) => {
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
