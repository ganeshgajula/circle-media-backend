const express = require("express");
const router = express.Router();
const { Post } = require("../models/post.model");

router.route("/newPost").post(async (req, res) => {
  try {
    const { userId, content, postDate } = req.body;
    const newPost = new Post({
      userId,
      content,
      postDate: new Date().toISOString(),
    });
    let savedPost = await newPost.save();
    savedPost = await savedPost
      .populate({
        path: "userId",
        select: "firstname lastname username avatar",
      })
      .execPopulate();
    res.status(201).json({ success: true, savedPost });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        "Couldn't create new post. Kindly check the error message for more details",
      errorMessage: error.message,
    });
  }
});

router.route("/").get(async (req, res) => {
  try {
    const posts = await Post.find({}).populate({
      path: "userId",
      select: "firstname lastname username avatar",
    });
    res.status(200).json({ success: true, posts });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        "Couldn't get users. Kindly check the error message for more details",
      errorMessage: error.message,
    });
  }
});

router.param("postId", async (req, res, next, id) => {
  try {
    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Couldn't find post",
      });
    }

    req.post = post;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Couldn't find any associated post",
      errorMessage: error.message,
    });
  }
});

router.route("/:postId").get(async (req, res) => {
  try {
    let { post } = req;
    post = await post
      .populate({
        path: "userId",
        select: "firstname lastname username avatar",
      })
      .execPopulate();
    res.status(200).json({ success: true, post });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Couldn't find post associated with this id",
      errorMessage: error.message,
    });
  }
});

// Get all the posts from single user

router.param("userId", async (req, res, next, id) => {
  try {
    const posts = Post.find({});

    if (!posts) {
      return res
        .status(404)
        .json({ success: false, message: "Couldn't find posts from user." });
    }

    req.posts = posts;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Couldn't find any posts from this user.",
      errorMessage: error.message,
    });
  }
});

router.route("/:userId").get(async (req, res) => {
  try {
    const { posts } = req;
    res.status(200).json({ success: true, posts });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        "Couldn't find posts from this user. Kindly check the error message for more details",
      errorMessage: error.message,
    });
  }
});

module.exports = router;
