const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const FileSchema = new Schema({
  caption: String,
  filename: {
    required: true,
    type: String,
  },
  fileId: {
    required: true,
    type: String,
  },
  createdAt: {
    default: Date.now(),
    type: Date,
  },
  url: String,
  contentType: String,
  user: String,
  meta: Object,
});

module.exports = mongoose.model("File", FileSchema);
