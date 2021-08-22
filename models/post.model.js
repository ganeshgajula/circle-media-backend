const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const PostSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    content: { type: String, required: "Post content cannot be empty" },
    postDate: String,
    likedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    retweetedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    bookmarkedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    replies: [
      {
        replierId: { type: Schema.Types.ObjectId, ref: "User" },
        content: String,
        date: String,
        isActive: Boolean,
      },
    ],
  },
  { timestamps: true }
);

const Post = model("Post", PostSchema);

module.exports = { Post };
