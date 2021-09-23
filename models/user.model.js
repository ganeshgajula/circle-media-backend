const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const UserSchema = new Schema(
  {
    firstname: { type: String, required: "first name is required" },
    lastname: { type: String, required: "last name is required" },
    username: {
      type: String,
      required: "username is required",
      unique: true,
      index: true,
    },
    email: { type: String, required: "email is required" },
    password: { type: String, required: "password is required" },
    avatar: { type: String, default: "" },
    bio: { type: String, default: "Just got started with app." },
    location: { type: String, default: "IN" },
    link: { type: String, default: "sample-demo-link.com" },
    joinedOn: { type: String },
    followers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: Schema.Types.ObjectId, ref: "User" }],
    notifications: [
      {
        originatorUserId: { type: Schema.Types.ObjectId, ref: "User" },
        type: { type: String, required: "Notification type must be mentioned" },
        postId: { type: Schema.Types.ObjectId, ref: "Post" },
        date: String,
      },
    ],
  },
  { timestamps: true }
);

const User = model("User", UserSchema);

module.exports = { User };
