const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// register controller
const registerUser = async (req, res) => {
  try {
    // extract user information from req.body
    const { username, email, password, role } = req.body;

    // check if the user is already exist in our database
    const checkExistingUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (checkExistingUser) {
      return res.status(400).json({
        success: false,
        message:
          "User with this username and/or email is already exist. Please try with a different username and/or email.",
      });
    }

    // hash user password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // create a new user and save into db
    await User.create({
      username,
      email,
      password: hashedPassword,
      role: role || "user",
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully!",
    });
  } catch (error) {
    handleError(error, res, "Unable to register user! Please try again.");
  }
};

// login controller
const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    // find if the current user exists in db
    const user = await User.findOne({ username });

    if (!user) {
      handleInvalidCred(res);
      return;
    }

    // check if the pasword is correct
    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      handleInvalidCred(res);
      return;
    }

    // create user token
    const accessToken = jwt.sign(
      {
        userId: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.JWT_SECRET_KEY,
      {
        expiresIn: "30m",
      }
    );

    res.status(200).json({
      success: true,
      message: "Log in successful!",
      accessToken,
    });
  } catch (error) {
    handleError(error, res);
  }
};

const changePassword = async (req, res) => {
  try {
    const userId = req.userInfo.userId;

    // extract old and new password
    const { oldPassword, newPassword } = req.body;

    // find the current logged in user
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // check if old password is correct
    const isOldPasswordMatch = await bcrypt.compare(oldPassword, user.password);

    if (!isOldPasswordMatch) {
      return res.status(400).json({
        success: false,
        message: "Old password is incorrect. Please try again.",
      });
    }

    // hash the new password
    const salt = await bcrypt.genSalt(10);
    const newHashedPassword = await bcrypt.hash(newPassword, salt);

    // update user password
    user.password = newHashedPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully!",
    });
  } catch (error) {
    handleError(error, res);
  }
};

function handleError(
  error,
  res,
  message = "Something went wrong! Please try again."
) {
  console.error(error);
  res.status(500).json({
    success: false,
    message,
  });
}

function handleInvalidCred(res) {
  res.status(400).json({
    success: false,
    message: "Invalid username and/or password. Please try again.",
  });
}

module.exports = { registerUser, loginUser, changePassword };
