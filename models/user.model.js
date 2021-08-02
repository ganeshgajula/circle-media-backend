const mongoose = require("mongoose");
const { Schema } = mongoose;

const UserSchema = new Schema(
  {
    firstname: { type: String, required: "first name is required" },
    lastname: { type: String, required: "last name is required" },
    username: { type: String, required: "username is required", unique: true },
    email: { type: String, required: "email is required" },
    password: { type: String, required: "password is required" },
    avatar: { type: String, default: "" },
    bio: { type: String, default: "" },
    location: { type: String, default: "IN" },
    link: { type: String, default: "" },
    joinedOn: { type: String },
    followers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

const User = mongoose.model("User", UserSchema);

module.exports = { User };
