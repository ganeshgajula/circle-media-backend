const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const express = require("express");
const router = express.Router();
const { User } = require("../models/user.model");
const { extend } = require("lodash");
const { authVerify } = require("../middlewares/authVerify");

router.route("/signup").post(async (req, res) => {
  try {
    let { firstname, lastname, username, email, password } = req.body;
    const isEmailAlreadyTaken = await User.findOne({ email });

    let initialLetterOfFirstName = firstname.substring(0, 1);
    let remainingLettersOfFirstName = firstname.substring(1);
    const upperCasedInitialOfFirstName = initialLetterOfFirstName.toUpperCase();
    const lowerCasedRemainingLettersOfFirstName =
      remainingLettersOfFirstName.toLowerCase();

    let initialLetterOfLastName = lastname.substring(0, 1);
    let remainingLettersOfLastName = lastname.substring(1);
    const upperCasedInitialOfLastName = initialLetterOfLastName.toUpperCase();
    const lowerCasedRemainingLettersOfLastName =
      remainingLettersOfLastName.toLowerCase();

    if (!isEmailAlreadyTaken) {
      const newUser = new User({
        firstname: `${upperCasedInitialOfFirstName}${lowerCasedRemainingLettersOfFirstName}`,
        lastname: `${upperCasedInitialOfLastName}${lowerCasedRemainingLettersOfLastName}`,
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        password,
        joinedOn: new Date().toISOString(),
      });
      const salt = await bcrypt.genSalt(10);
      newUser.password = await bcrypt.hash(newUser.password, salt);
      const savedUser = await newUser.save();
      return res.status(201).json({ success: true, savedUser });
    }
    return res.status(409).json({
      success: false,
      message:
        "This email is already registered with us, kindly signup with different credentials.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "username already taken. Please enter a different username",
      errorMessage: error.message,
    });
  }
});

router.route("/authenticate").post(async (req, res) => {
  try {
    const email = req.get("email");
    const password = req.get("password");
    const user = await User.findOne({ email }).populate({
      path: "following followers",
    });

    if (user) {
      const validPassword = await bcrypt.compare(password, user.password);
      if (validPassword) {
        const token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, {
          expiresIn: "24h",
        });
        return res.status(200).json({
          success: true,
          user,
          token: `Bearer ${token}`,
        });
      }
      return res.status(401).json({
        success: false,
        message:
          "Invalid user credentials, please enter correct email and password",
      });
    }
    return res.status(401).json({
      success: false,
      message:
        "This email id is not registered with us. Kindly visit signup page and create a new account.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Kindly check the error message for more details",
      errorMessage: error.message,
    });
  }
});

router.use(authVerify);

router.route("/").get(async (req, res) => {
  try {
    const users = await User.find({})
      .select("-password")
      .populate({ path: "following followers" });

    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Couldn't get users at the moment. Please try again.",
      errorMessage: error.message,
    });
  }
});

router.param("username", async (req, res, next, username) => {
  try {
    const user = await User.findOne({ username }).select("-password").populate({
      path: "following followers notifications.originatorUserId notifications.postId",
      select: "firstname lastname username content",
    });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "No user found with this username",
      errorMessage: error.message,
    });
  }
});

router
  .route("/:username")
  .get(async (req, res) => {
    try {
      const { user } = req;
      res.json({ success: true, user });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          "Couldn't find user. Kindly check the error message for more details",
        errorMessage: error.message,
      });
    }
  })
  .post(async (req, res) => {
    try {
      let { user } = req;
      const userUpdates = req.body;
      user = extend(user, userUpdates);
      const updatedUser = await user.save();
      res.status(200).json({ success: true, updatedUser });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          "Couldn't update user details, kindly check the error message for more details",
        errorMessage: error.message,
      });
    }
  });

router.route("/:username/followunfollow").post(async (req, res) => {
  try {
    let { user } = req;
    let userUpdates = req.body;
    const isFollowedByIndex = user.followers.findIndex(
      (user) => String(user._id) === String(userUpdates.userId)
    );
    isFollowedByIndex !== -1
      ? user.followers.splice(isFollowedByIndex, 1)
      : user.followers.push(userUpdates.userId);

    let followedToUser = await user.save();
    followedToUser = await followedToUser
      .populate({ path: "following followers" })
      .execPopulate();

    let followedByUser = await User.findById(userUpdates.userId).populate({
      path: "following followers",
    });

    const isFollowingByIndex = followedByUser.following.findIndex(
      ({ _id }) => String(_id) === String(user._id)
    );
    isFollowingByIndex !== -1
      ? followedByUser.following.splice(isFollowingByIndex, 1)
      : followedByUser.following.push(user._id);
    followedByUser = await followedByUser.save();
    followedByUser = await followedByUser
      .populate({ path: "following followers" })
      .execPopulate();

    res.status(200).json({ success: true, followedToUser, followedByUser });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        "Couldn't follow or unfollow user. Please try again after some time.",
      errorMessage: error.message,
    });
  }
});

router.route("/:username/notifications").post(async (req, res) => {
  try {
    let { user } = req;
    let { originatorUserId, type, postId } = req.body;

    const notificationIndex = user.notifications.findIndex(
      ({ originatorUserId: { _id }, type: notifiedType, postId: postID }) =>
        String(_id) === originatorUserId &&
        notifiedType === type &&
        String(postID?._id) === postId
    );

    const isFollowedNotified = user.notifications.findIndex(
      ({ originatorUserId: { _id }, type: notifiedType }) =>
        String(_id) === originatorUserId && notifiedType === type
    );

    const addAndRemoveNotification = (notificationIndex) =>
      notificationIndex !== -1
        ? user.notifications.splice(notificationIndex, 1)
        : user.notifications.push({
            originatorUserId,
            type,
            postId,
            date: new Date().toISOString(),
          });

    isFollowedNotified !== -1 && type === "Followed"
      ? user.notifications.splice(isFollowedNotified, 1)
      : addAndRemoveNotification(notificationIndex);

    let updatedUser = await user.save();
    updatedUser = await updatedUser
      .populate({
        path: "notifications.originatorUserId notifications.postId",
        select: "firstname lastname username content",
      })
      .execPopulate();

    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong, kindly check the error message",
      errorMessage: error.message,
    });
  }
});

module.exports = router;
