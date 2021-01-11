const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");
const passportJWT = require("passport-jwt");
const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;

const User = require("./models/user");

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    (email, password, done) => {
      User.findOne({ email })
        .then((user) => {
          if (!user) {
            return done(null, false, { message: "Invalid email" });
          }

          bcrypt.compare(password, user.password, (err, res) => {
            if (res) {
              // passwords match, log in user
              return done(null, user.toJSON(), { message: "Successful login" });
            } else {
              // passwords dont match
              return done(null, false, { message: "Incorrect password" });
            }
          });
        })
        .catch((err) => done(err));
    }
  )
);

passport.use(
  new JWTStrategy(
    {
      jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.SECRET_KEY,
    },
    (jwtPayload, done) => {
      User.findById(jwtPayload._id)
        .then((user) => done(null, user))
        .catch((err) => {
          done(err, false, { message: "invalid token" });
        });
    }
  )
);
