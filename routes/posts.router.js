const express = require("express");
const router = express.Router();
const { extend } = require("lodash");
const { Post } = require("../models/post.model");
const { User } = require("../models/user.model");

router.param("userId", async (req, res, next, id) => {
  try {
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Couldn't find any user associated with this id",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(400).json({
      success: false,
      message:
        "Couldn't find user. Kindly check the error message for more details",
      errorMessage: error.message,
    });
  }
});

router.param("userId", async (req, res, next, id) => {
  try {
    let posts = await Post.findOne({ userId: id });
    if (!posts) {
      posts = new Post({ userId: id, posts: [] });
      posts = await posts.save();
    }

    req.posts = posts;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        "Couldn't fetch posts from this user. Kindly check error message for more details.",
      errorMessage: error.message,
    });
  }
});

router
  .route("/:userId")
  .get(async (req, res) => {
    try {
      let { posts } = req;
      posts = await posts
        .populate({
          path: "userId",
          select: "firstname lastname username avatar",
        })
        .execPopulate();
      res.json({ success: true, posts });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          "Couldn't fetch posts from this user. Kindly check the error message for more details",
        errorMessage: error.message,
      });
    }
  })
  .post(async (req, res) => {
    try {
      let { posts } = req;
      const postUpdates = req.body;

      posts.posts.push({
        content: postUpdates.content,
        postDate: new Date().toISOString(),
        likedBy: [],
        retweetedBy: [],
        bookmarkedBy: [],
        replies: [],
      });

      let updatedPosts = await posts.save();
      updatedPosts = await updatedPosts
        .populate({
          path: "userId",
          select: "firstname lastname username avatar",
        })
        .execPopulate();
      res.status(200).json({ success: true, posts: updatedPosts });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          "Couldn't add new post, kindly check error message for more details",
        errorMessage: error.message,
      });
    }
  });

router.param("postId", async (req, res, next, id) => {
  try {
    let { posts } = req;
    const matchedPost = posts.posts.find((post) => post._id == id);

    if (!matchedPost) {
      return res
        .status(404)
        .json({ success: false, message: "No posts matched with given id" });
    }

    req.requestedPost = matchedPost;
    next();
  } catch (error) {
    res.status(400).json({
      success: false,
      message:
        "Can't fetch post with given id. Kindly check the error message for more details",
      errorMessage: error.message,
    });
  }
});

router
  .route("/:userId/:postId")
  .get(async (req, res) => {
    try {
      let { requestedPost } = req;
      res.status(200).json({ success: true, post: requestedPost });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          "Couldn't get post. Kindly check the error message for more details",
        errorMessage: error.message,
      });
    }
  })
  .post(async (req, res) => {
    try {
      let { requestedPost, posts } = req;
      const postUpdates = req.body;
      requestedPost = extend(requestedPost, postUpdates);
      posts = await posts.save();
      res.status(200).json({ success: true, requestedPost });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          "Couldn't update post. Kindly check the error message for more details",
        errorMessage: error.message,
      });
    }
  })
  .delete(async (req, res) => {
    try {
      let { requestedPost, posts } = req;
      await requestedPost.remove();
      posts = await posts.save();
      res.json({ success: true, posts });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          "Couldn't delete post. Kindly check the error message for more details",
        errorMessage: error.message,
      });
    }
  });

router.route("/:userId/:postId/replies").post(async (req, res) => {
  try {
    let { requestedPost, posts, user } = req;
    let newReply = req.body;
    requestedPost = requestedPost.replies.push({
      userId: user._id,
      content: newReply.message,
      date: new Date().toISOString(),
    });
    updatedPosts = await posts.save();
    updatedPosts = await updatedPosts
      .populate({
        path: "posts.replies.userId",
        select: "firstname lastname username avatar",
      })
      .execPopulate();
    res.status(201).json({ success: true, posts: updatedPosts });
  } catch (error) {
    res.status(500).json({
      success: true,
      message:
        "Couldn't post reply message. Kindly check the error message for more info",
      errorMessage: error.message,
    });
  }
});

router.param("replyId", async (req, res, next, id) => {
  try {
    let { requestedPost } = req;
    const matchedReply = requestedPost.replies.find((reply) => reply._id == id);

    if (!matchedReply) {
      return res
        .status(404)
        .json({ success: false, message: "No reply found with provided id" });
    }

    req.replyMessage = matchedReply;
    next();
  } catch (error) {
    res.status(400).json({
      success: false,
      message:
        "Can't fetch reply with given id. Kindly check the error message for more details",
      errorMessage: error.message,
    });
  }
});

router
  .route("/:userId/:postId/replies/:replyId")
  .post(async (req, res) => {
    try {
      let { replyMessage, posts } = req;
      const replyMessageUpdates = req.body;
      replyMessage = extend(replyMessage, replyMessageUpdates);
      posts = await posts.save();
      res.status(200).json({ success: true, posts });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          "Couldn't update reply message. Kindly check the error message for more details",
        errorMessage: error.message,
      });
    }
  })
  .delete(async (req, res) => {
    try {
      let { replyMessage, posts } = req;
      await replyMessage.remove();
      posts = await posts.save();
      res.json({ succcess: true, posts });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          "Couldn't delete reply message. Kindly check the error message for more details",
        errorMessage: error.message,
      });
    }
  });

module.exports = router;
