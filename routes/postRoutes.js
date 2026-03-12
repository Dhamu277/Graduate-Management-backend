const express = require('express');
const router = express.Router();
const { getPosts, createPost, likePost } = require('../controllers/postController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getPosts)
  .post(protect, createPost);

router.route('/:id/like')
  .put(protect, likePost);

module.exports = router;
