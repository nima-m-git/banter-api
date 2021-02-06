const router = require("express").Router();

const postController = require("../controllers/postController");

// GET all recent posts
router.get("/", postController.index);

// POST create post
router.post("/", postController.create_post);

// GET single post
router.get("/:id", postController.get_post);

// PUT edit post
router.put("/:id", postController.edit_post);

// DELETE delete post
router.delete("/:id", postController.delete_post);

// POST comment on post
router.post("/:id", postController.add_comment);

// PUT like post
router.post("/:id/like", postController.like_post);

// DELETE comment
router.delete("/:id/:commentId", postController.delete_comment);

module.exports = router;
