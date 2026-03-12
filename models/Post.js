const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: true
  },
  image: {
    type: String
  },
  fileUrl: {
    type: String
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  type: {
    type: String,
    enum: ['General update', 'Career update', 'Event post', 'Achievement post', 'Discussion post'],
    default: 'General update'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Post', postSchema);
