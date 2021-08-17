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

router
  .route("/:userId")
  .get(async (req, res) => {
    try {
      let { user } = req;
      const userPosts = await Post.find({ userId: user._id }).populate({
        path: "userId",
        select: "firstname lastname username avatar",
      });
      res.json({ success: true, posts: userPosts });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          "Couldn't fetch posts of this user. Kindly check the error message for more details",
        errorMessage: error.message,
      });
    }
  })
  .post(async (req, res) => {
    try {
      let { user } = req;
      const postUpdates = req.body;

      const newPost = await new Post({
        userId: user._id,
        content: postUpdates.content,
        postDate: new Date().toISOString(),
        likedBy: [],
        retweetedBy: [],
        bookmarkedBy: [],
        replies: [],
      });

      let savedPost = await newPost.save();
      savedPost = await savedPost
        .populate({
          path: "userId replies.replierId",
          select: "firstname lastname username avatar",
        })
        .execPopulate();
      res.status(200).json({ success: true, posts: savedPost });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Couldn't add new post",
        errorMessage: error.message,
      });
    }
  });

router.route("/").get(async (req, res) => {
  try {
    let posts = await Post.find({}).populate({
      path: "userId",
      select: "firstname lastname username avatar",
    });
    res.json({ success: true, posts });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Couldn't fetch posts",
      errorMessage: error.message,
    });
  }
});

router.param("postId", async (req, res, next, id) => {
  try {
    const posts = await Post.find({}).populate({
      path: "userId",
      select: "firstname lastname username avatar",
    });

    const matchedPost = await Post.findById(id).populate({
      path: "userId",
      select: "firstname lastname username avatar",
    });

    if (!matchedPost) {
      return res
        .status(404)
        .json({ success: false, message: "No posts matched with given id" });
    }

    req.posts = posts;
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
        message: "Couldn't access requested post. Please try again.",
        errorMessage: error.message,
      });
    }
  })
  .post(async (req, res) => {
    try {
      let { requestedPost } = req;
      const postUpdates = req.body;
      requestedPost = extend(requestedPost, postUpdates);
      const updatedPost = await requestedPost.save();
      res.status(200).json({ success: true, updatedPost });
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
      let { requestedPost } = req;
      await requestedPost.remove();
      res.json({ success: true, post: requestedPost });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          "Couldn't delete post. Kindly check the error message for more details",
        errorMessage: error.message,
      });
    }
  });

router.route("/:userId/:postId/likes").post(async (req, res) => {
  try {
    let { requestedPost } = req;
    const likeUpdates = req.body;
    const likedByUserIndex = requestedPost.likedBy.findIndex(
      (userId) => String(userId) === String(likeUpdates.likedByUserId)
    );
    likedByUserIndex !== -1
      ? requestedPost.likedBy.splice(likedByUserIndex, 1)
      : requestedPost.likedBy.push(likeUpdates.likedByUserId);
    let likedPost = await requestedPost.save();
    likedPost = await likedPost
      .populate({
        path: "replies.replierId",
        select: "firstname lastname username avatar",
      })
      .execPopulate();
    res.status(200).json({ success: true, likedPost });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Couldn't update post likes. Please try again after some time.",
      errorMessage: error.message,
    });
  }
});

router.route("/:userId/:postId/retweets").post(async (req, res) => {
  try {
    let { requestedPost } = req;
    const retweetUpdates = req.body;
    const retweetedByUserIndex = requestedPost.retweetedBy.findIndex(
      (userId) => String(userId) === String(retweetUpdates.retweetedByUserId)
    );
    retweetedByUserIndex !== -1
      ? requestedPost.retweetedBy.splice(retweetedByUserIndex, 1)
      : requestedPost.retweetedBy.push(retweetUpdates.retweetedByUserId);
    let retweetedPost = await requestedPost.save();
    retweetedPost = await retweetedPost
      .populate({
        path: "replies.replierId",
        select: "firstname lastname username avatar",
      })
      .execPopulate();
    res.status(200).json({ success: true, retweetedPost });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        "Couldn't update retweet count. Please try again after some time.",
      errorMessage: error.message,
    });
  }
});

router.route("/:userId/:postId/bookmarks").post(async (req, res) => {
  try {
    let { requestedPost } = req;
    const bookmarkUpdates = req.body;
    const bookmarkedByUserIndex = requestedPost.bookmarkedBy.findIndex(
      (userId) => String(userId) === String(bookmarkUpdates.bookmarkedByUserId)
    );
    bookmarkedByUserIndex !== -1
      ? requestedPost.bookmarkedBy.splice(bookmarkedByUserIndex, 1)
      : requestedPost.bookmarkedBy.push(bookmarkUpdates.bookmarkedByUserId);
    let bookmarkedPost = await requestedPost.save();
    bookmarkedPost = await bookmarkedPost
      .populate({
        path: "replies.replierId",
        select: "firstname lastname username avatar",
      })
      .execPopulate();
    res.status(200).json({ success: true, bookmarkedPost });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Couldn't add to bookmarks. Please try again after some time.",
      errorMessage: error.message,
    });
  }
});

router.route("/:userId/:postId/replies").post(async (req, res) => {
  try {
    let { requestedPost } = req;
    let newReply = req.body;
    requestedPost.replies.push({
      replierId: newReply.replierId,
      content: newReply.message,
      date: new Date().toISOString(),
    });
    let repliedToPost = await requestedPost.save();
    repliedToPost = await repliedToPost
      .populate({
        path: "userId replies.replierId",
        select: "firstname lastname username avatar",
      })
      .execPopulate();
    res.status(201).json({ success: true, repliedToPost });
  } catch (error) {
    res.status(500).json({
      success: true,
      message: "Couldn't post reply message.",
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
      let { replyMessage, requestedPost } = req;
      const replyMessageUpdates = req.body;
      replyMessage = extend(replyMessage, replyMessageUpdates);
      let postAfterReplyUpdate = await requestedPost.save();
      res.status(200).json({ success: true, postAfterReplyUpdate });
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
      let { replyMessage, requestedPost } = req;
      await replyMessage.remove();
      await requestedPost.save();
      res.json({ succcess: true, post: requestedPost });
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
