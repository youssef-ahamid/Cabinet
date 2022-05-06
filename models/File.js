const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const FileSchema = new Schema({
  caption: String,
  name: {
    required: true,
    type: String,
  },
  filename: {
    required: true,
    type: String,
  },
  createdAt: {
    default: Date.now(),
    type: Date,
  },
  data: {
    type: mongoose.Types.ObjectId,
    ref: 'Binary',
    required: true,
  },
  contentType: String,
  url: String,
  user: String,
  meta: Object,
});

module.exports = mongoose.model("File", FileSchema);
