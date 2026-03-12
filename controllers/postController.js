const Post = require('../models/Post');
const Comment = require('../models/Comment');

// @desc    Get all posts
// @route   GET /api/posts
// @access  Private
const getPosts = async (req, res, next) => {
  try {
    const posts = await Post.find()
      .populate('user', 'name role profileImage')
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a post
// @route   POST /api/posts
// @access  Private
const createPost = async (req, res, next) => {
  try {
    const { text, image, fileUrl, type } = req.body;

    const post = await Post.create({
      user: req.user._id,
      text,
      image,
      fileUrl,
      type
    });

    res.status(201).json(post);
  } catch (error) {
    next(error);
  }
};

// @desc    Like or Unlike a post
// @route   PUT /api/posts/:id/like
// @access  Private
const likePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if post has already been liked by this user
    if (post.likes.includes(req.user._id)) {
      // Unlike
      post.likes = post.likes.filter(x => x.toString() !== req.user._id.toString());
    } else {
      // Like
      post.likes.push(req.user._id);
    }

    await post.save();
    res.json(post.likes);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPosts,
  createPost,
  likePost
};
