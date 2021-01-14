const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const UserSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      maxlength: 50,
    },
    password: {
      type: String,
      minlength: 5,
    },
    firstName: {
      type: String,
      minlength: 2,
      required: true,
    },
    lastName: {
      type: String,
      minlength: 2,
      required: true,
    },
    friends: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    requests: [
      {
        _id: Schema.Types.ObjectId,
        status: {
          type: String,
          enum: ["pending", "received", "accepted", "denied"],
        },
      },
    ],
    posts: [
      {
        type: Schema.Types.ObjectId,
        ref: "Post",
      },
    ],
    filename: {
      type: String,
    },
    mimetype: {
      type: String,
    },
  },
  {
    virtuals: true,
  }
);

// Virtual for user url
UserSchema.virtual("url").get(() => "/user/" + this._id);

// Virtual for user full name formatted
UserSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for image's URL
UserSchema.virtual("imageurl").get(function () {
  return "/images/" + this.filename;
});

// UserSchema.set("toObject", { virtuals: true });
// UserSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("User", UserSchema);
