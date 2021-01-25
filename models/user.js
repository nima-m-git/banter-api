const mongoose = require("mongoose");
const mongooseLeanVirtuals = require("mongoose-lean-virtuals");

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
    image: {
      type: Schema.Types.ObjectId,
      ref: "Image",
    },
  },
  {
    virtuals: true,
    getters: true,
  }
);

// Virtual for user url
UserSchema.virtual("url").get(function () {
  "/user/" + this._id;
});

// Virtual for user full name formatted
UserSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

UserSchema.set("toObject", { virtuals: true, getters: true });
UserSchema.set("toJSON", { virtuals: true, getters: true });

UserSchema.plugin(mongooseLeanVirtuals);

module.exports = mongoose.model("User", UserSchema);
