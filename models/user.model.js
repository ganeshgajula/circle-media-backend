const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    firstname: { type: String, required: "first name is required" },
    lastname: { type: String, required: "last name is required" },
    username: { type: String, required: "username is required", unique: true },
    email: { type: String, required: "email is required" },
    password: { type: String, required: "password is required" },
    avatar: { type: String, default: "" },
    bio: { type: String, default: "" },
    location: { type: String, default: "" },
    link: { type: String, default: "" },
    joinedOn: { type: String, required: "user joined date is required" },
    followers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

const User = mongoose.model("User", UserSchema);

module.exports = { User };
