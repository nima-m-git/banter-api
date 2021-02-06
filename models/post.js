const mongoose = require("mongoose");
const mongooseLeanVirtuals = require("mongoose-lean-virtuals");
const Schema = mongoose.Schema;

const PostSchema = new Schema({
  content: {
    type: String,
    required: true,
    maxlength: 5000,
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  timeCreated: {
    type: Date,
    default: Date.now(),
  },
  comments: [
    {
      type: Schema.Types.ObjectId,
      ref: "Comment",
    },
  ],
  likes: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  ],
});

// Virtual for posts URL
PostSchema.virtual("url").get(function () {
  return "/post/" + this._id;
});

PostSchema.set("toObject", { virtuals: true, getters: true });
PostSchema.set("toJSON", { virtuals: true, getters: true });

PostSchema.plugin(mongooseLeanVirtuals);

module.exports = mongoose.model("Post", PostSchema);
