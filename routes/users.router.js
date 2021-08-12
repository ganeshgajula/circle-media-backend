const express = require("express");
const router = express.Router();
const { User } = require("../models/user.model");
const { extend } = require("lodash");

router.route("/signup").post(async (req, res) => {
  try {
    let { firstname, lastname, username, email, password } = req.body;
    const isEmailAlreadyTaken = await User.findOne({ email });

    let initialLetterOfFirstName = firstname.substring(0,1);
    let remainingLettersOfFirstName = firstname.substring(1);
    const upperCasedInitialOfFirstName = initialLetterOfFirstName.toUpperCase();
    const lowerCasedRemainingLettersOfFirstName = remainingLettersOfFirstName.toLowerCase();


    let initialLetterOfLastName = lastname.substring(0,1);
    let remainingLettersOfLastName = lastname.substring(1);
    const upperCasedInitialOfLastName = initialLetterOfLastName.toUpperCase();
    const lowerCasedRemainingLettersOfLastName = remainingLettersOfLastName.toLowerCase();

    if (!isEmailAlreadyTaken) {
      const newUser = new User({
        firstname: `${upperCasedInitialOfFirstName}${lowerCasedRemainingLettersOfFirstName}`,
        lastname: `${upperCasedInitialOfLastName}${lowerCasedRemainingLettersOfLastName}`,
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        password,
        joinedOn: new Date().toISOString(),
      });
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
    const user = await User.findOne({ email });

    if (user && user.password === password) {
      return res.status(200).json({ success: true, user });
    } else if (!user) {
      return res.status(401).json({
        success: false,
        message:
          "This email id is not registered with us. Kindly visit signup page and create a new account.",
      });
    }
    return res.status(401).json({
      success: false,
      message:
        "Invalid user credentials, please enter correct email and password",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Kindly check the error message for more details",
      errorMessage: error.message,
    });
  }
});

router.param("email", async (req, res, next, email) => {
  try {
    const user = await User.findOne({ email }).select("-password");
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
      message: "No user found with this email",
      errorMessage: error.message,
    });
  }
});

router.route("/:email").post(async (req, res) => {
  try {
    let { user } = req;
    const userUpdates = req.body;
    user = extend(user, userUpdates);
    const updatedUserDetails = await user.save();
    res.status(200).json({ success: true, updatedUserDetails });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        "Couldn't update user details, kindly check the error message for more details",
      errorMessage: error.message,
    });
  }
});

router.route("/:email/user").get(async (req, res) => {
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
});

router.route("/").get(async (req, res) => {
  try {
    const users = await User.find({}).select("-password");
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        "Couldn't get users, kindly check the error message for more details",
      errorMessage: error.message,
    });
  }
});

module.exports = router;
