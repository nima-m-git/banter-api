const passport = require("passport");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");

const User = require("../models/user");
const { request } = require("express");

// User sign up
exports.signup = [
  body("email", "Must be valid email")
    .isEmail()
    .escape()
    .custom(async (value, { req }) => {
      const emails = (await User.find({}, "email")).map((obj) => obj.email);
      if (emails.includes(value)) {
        throw new Error("Email already registered");
      }
      return true;
    }),
  body("password")
    .isLength({ min: 5 })
    .withMessage("Password must be at least 5 characters long")
    .escape(),
  body("confirmPassword").custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error("Passwords must match");
    }
    return true;
  }),
  body("firstName", "Valid first name required").isAlpha().trim(),
  body("lastName").isAlpha().trim().withMessage("Valid last name required"),
  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(500).json({ ...errors, ...req.body });
    }

    bcrypt.hash(req.body.password, 10, (err, hashedPassword) => {
      if (err) {
        return next(err);
      }

      new User({
        ...req.body,
        password: hashedPassword,
      })
        .save()
        .then((user) =>
          res.status(200).send({
            user,
            message: "succesful registration",
          })
        )
        .catch((err) => next(err));
    });
  },
];

// User login
exports.login = (req, res, next) => {
  passport.authenticate("local", { session: false }, (err, user, message) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.send({ ...message });
    }

    req.login(user, { session: false }, (err) => {
      if (err) return next(err);
      // generate a signed json web token with contents of user object and return in res
      const token = jwt.sign(user, process.env.SECRET_KEY, { expiresIn: "1d" });
      return res.json({ token });
    });
  })(req, res, next);
};

// User logout
exports.logout = (req, res) => {
  req.logout();
  res.json({
    message: "logout successful",
  });
};

// User index
exports.user_index = async (req, res, next) => {
  try {
    const users = await User.find()
      .lean()
      .populate("friends", "-password")
      .lean({ virtuals: true })
      .exec();

    // add friend status in res relative to current user
    users.forEach((user) => {
      user.friendsStatus = user.requests.find(
        (person) => person?._id == req.user.id
      )?.status;
    });

    res.send({ users });
  } catch (err) {
    return next(err);
  }
};

// User profile
exports.user_profile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .populate("posts friends")
      .exec();

    // add friend status in res relative to current user
    user.friendsStatus = user.requests.find(
      (person) => person?._id == req.user.id
    )?.status;

    res.send({ user });
  } catch (err) {
    return next(err);
  }
};

// Send friend request
exports.send_request = async (req, res, next) => {
  // check current friend status
  try {
    const requestUser = await User.findById(req.params.id).exec();
    const currentUser = await User.findById(req.user.id).exec();

    const connectedFriend = requestUser.requests.find(
      (person) => person?._id == req.user.id
    );

    if (connectedFriend?.status == "denied") {
      // remove denied status upon request - while testing
      requestUser.requests = requestUser.requests.filter(
        (request) => request._id != req.user.id
      );
      currentUser.requests = currentUser.requests.filter(
        (request) => request._id != req.params.id
      );
      await requestUser.save();
      await currentUser.save();
    }

    if (!connectedFriend) {
      //   users not connected, allow request
      try {
        requestUser.requests.push({
          _id: req.user.id,
          status: "received",
        });
        await requestUser.save();

        currentUser.requests.push({
          _id: req.params.id,
          status: "pending",
        });
        await currentUser.save();

        res.send({ msg: `request to ${requestUser.fullName} sent` });
      } catch (err) {
        return next(err);
      }
    } else {
      // users already connected
      res.send({
        msg: `request to ${requestUser.fullName} could not be made, status currently ${connectedFriend.status}`,
      });
    }
  } catch (err) {
    next(err);
  }
};

// Respond to request
exports.respond_request = async (req, res, next) => {
  const { requestResponse } = { ...req.body };
  const requestUserId = req.params.id;
  const currentUserId = req.user.id;

  try {
    const requestUser = await User.findById(requestUserId).exec();
    const currentUser = await User.findById(currentUserId).exec();

    const currentRequestStatus = currentUser.requests.find(
      (request) => request._id == requestUserId
    )?.status;
    if (currentRequestStatus !== "received") {
      // no connection request from requested user
      return next(new Error("no connection request from user"));
    }

    if (!(requestResponse == "accepted" || requestResponse == "denied")) {
      return next(new Error('response must be "accepted" or "denied'));
    }

    if (requestResponse === "accepted") {
      // accepted request, add to eachothers friends list
      requestUser.friends.push(currentUserId);
      currentUser.friends.push(requestUserId);
    }

    // update request statuses
    requestUser.requests.find(
      (request) => request._id == currentUserId
    ).status = requestResponse;

    currentUser.requests.find(
      (request) => request._id == requestUserId
    ).status = requestResponse;

    await requestUser.save();
    await currentUser.save();

    res.send({ msg: `request ${requestResponse}` });
  } catch (err) {
    return next(err);
  }
};
