const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");

// POST sign up
router.post("/signup", userController.signup);

// POST login
router.post("/login", userController.login);

// GET logout
router.get("/logout", userController.logout);

// GET test
router.get("/", (req, res) => res.send(`Hello ${req.user || "Banter"}!`));

module.exports = router;
