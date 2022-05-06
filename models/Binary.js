const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const BinarySchema = new Schema({
  binary: {
    type: Buffer,
    required: true,
  },
  file: {
    type: mongoose.Types.ObjectId,
    ref: 'file'
  },
  meta: Object,
});

module.exports = mongoose.model("Binary", BinarySchema);
