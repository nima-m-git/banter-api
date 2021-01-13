const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");

// GET user index
router.get("/", userController.user_index);

// // GET user profile
// router.get("/:id", userController.user_profile);

// POST send friend request
router.post("/:id", userController.send_request);

// // GET friends
// router.get("/friends", userController.get_friends);

// // POST respond friend request
// router.post("/friends", userController.respond_request);

module.exports = router;
