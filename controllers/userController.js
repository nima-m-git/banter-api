const passport = require("passport");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");

const User = require("../models/user");

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
  body("firstName", "Valid name required")
    .isLength({ min: 2 })
    .isAlpha()
    .trim()
    .escape(),
  body("lastName", "Valid name required")
    .isLength({ min: 2 })
    .isAlpha()
    .trim()
    .escape(),

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
      return res.status(400).send({ ...message });
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
exports.user_index = (req, res, next) => {
  User.find()
    .populate("friends")
    .exec()
    .then((users) => res.send(users))
    .catch((err) => next(err));
};

// User summary
exports.user_index = (req, res, next) => {
  User.findById(req.params.id)
    .populate("posts")
    .exec()
    .then((user) => res.send(user))
    .catch((err) => next(err));
};

// Send friend request
exports.send_request = async (req, res, next) => {
  // check current friend status
  try {
    const requestUser = await User.findById(req.params.id).exec();
    const currentUser = await User.findById(req.user.id).exec();

    const connectedFriend = requestUser.friends.find(
      (friendData) => friendData?.friend == req.user.id
    );

    if (!connectedFriend) {
      //   users not connected, allow request
      try {
        await requestUser.friends.push({
          friend: {
            _id: req.user.id,
            msg: "meow",
          },
          status: "received",
        });
        await requestUser.save();

        await currentUser.friends.push({
          friend: {
            _id: req.params.id,
            msg: "holy",
          },
          status: "pending",
        });
        await currentUser.save();

        res.send({ msg: `request to ${requestUser.fullName} sent` });
      } catch (err) {
        return next(err);
      }
    } else {
      res.send({
        msg: `request to ${requestUser.fullName} could not be made`,
        friendsStatus: connectedFriend.status,
      });
    }
  } catch (err) {
    next(err);
  }
};
