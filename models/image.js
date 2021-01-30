const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ImageSchema = new Schema(
  {
    image: {
      data: Buffer,
      contentType: String,
      filename: String,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Image", ImageSchema);
