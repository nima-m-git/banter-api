const Post = require("../models/post");
const User = require("../models/user");
const Comment = require("../models/comment");

const { body, validationResult } = require("express-validator");

// Check user liked post
// exports.post_liked = (req, res, next) => {
//   Post.findById(req.params.id)
//   .then(post => {
//     const liked = !!post.likes.find(like => like._id == req.user.id)
//     res.send({ liked, })
//   })

//     return (!!post.likes.find(like => like._id == req.user.id))
//   }
// }

// Get all posts
exports.index = (req, res, next) => {
  Post.find()
    .lean({ virtuals: true })
    .sort([["timeCreated", "descending"]])
    .populate({
      path: "author likes comments",
      select: "username content image author",
    })
    .populate({
      path: "comments",
      select: "author",
      populate: {
        path: "author",
        select: "username",
      },
    })
    .exec()
    .then((posts) => {
      posts.forEach(
        (post) =>
          (post.liked = !!post.likes.find((like) => like._id == req.user.id))
      );
      res.send({ posts });
    })
    .catch((err) => next(err));
};

// Get post details
exports.get_post = (req, res, next) => {
  Post.findById(req.params.id)
    .lean({ virtuals: true })
    .populate({
      path: "author likes comments",
      select: "firstName lastName content image",
      populate: {
        path: "image author",
        select: "-password",
      },
    })
    .exec()
    .then((post) => {
      post.liked = !!post.likes.find((like) => like._id == req.user.id);
      res.send({ post });
    })
    .catch((err) => next(err));
};

// Post post
exports.create_post = [
  body("content", "content required")
    .trim()
    .isLength({ min: 1, max: 5000 })
    .escape(),

  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(500).json({ ...errors, ...req.body });

    try {
      const post = new Post({
        ...req.body,
        author: req.user.id,
      });
      await post.save();
      const user = await User.findById(req.user.id);
      user.posts.push(post);
      await user.save();

      res.send({ post, msg: "Post submitted" });
    } catch (err) {
      return next(err);
    }
  },
];

// Update post
exports.edit_post = [
  body("content", "Content required")
    .trim()
    .isLength({ min: 1, max: 5000 })
    .escape(),

  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(500).json({ ...errors, ...req.body });
    }

    try {
      const post = await Post.findById(req.params.id).populate("author").exec();

      if (post.author._id != req.user.id) {
        // user is not the post author
        return next(new Error("user not post author"));
      }

      post.content = req.body.content;
      await post.save();

      res.send({ update: post.content, msg: "Post updated" });
    } catch (err) {
      next(err);
    }
  },
];

// Delete post
exports.delete_post = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (post.author._id != req.user.id) {
      return next(new Error("user is not post author"));
    }

    await Post.findByIdAndDelete(req.params.id);
    res.send({ post, msg: "Post removed" });
  } catch (err) {
    return next(err);
  }
};

// Post a comment
exports.add_comment = [
  body("content", "content required")
    .isLength({ min: 1, max: 500 })
    .trim()
    .escape(),

  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(500).send({ ...errors, ...req.body });

    try {
      //   const author = await User.findById(req.user.id);
      const post = await Post.findById(req.params.id);

      const comment = new Comment({
        ...req.body,
        author: req.user.id,
        post: req.params.id,
      });
      await comment.save();

      post.comments.push(comment);
      await post.save();

      res.status(200).json({ success: true, msg: "comment added", comment });
    } catch (err) {
      next(err);
    }
  },
];

// Remove a comment
exports.delete_comment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId);

    if (comment.author._id != req.user.id) {
      // user not comment author
      return next(new Error("user is not comment author"));
    }

    await Comment.findByIdAndDelete(req.params.commentId);
    res.send({ msg: "comment removed" });
  } catch (err) {
    return next(err);
  }
};

// Like post
exports.like_post = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const post = await Post.findById(req.params.id);
    const liked = !!post.likes.find((like) => like._id == req.user.id);

    if (liked) {
      // if already liked, remove users like from post
      post.likes = post.likes.filter((like) => like._id != req.user.id);
    } else {
      // if not liked, add users like to post
      post.likes.push(user);
    }

    await post.save();
    res.send({ success: true, msg: `post ${liked ? "unliked" : "liked"}` });
  } catch (err) {
    next(err);
  }
};
