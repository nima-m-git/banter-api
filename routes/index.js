var express = require("express");
var router = express.Router();

const userController = require("../controllers/userController");

// POST sign up
router.post("/signup", userController.signup);

// POST login
router.post("/login", userController.login);

// GET logout
router.get("/logout", userController.logout);

module.exports = router;
