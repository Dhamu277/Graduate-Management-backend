const mongoose = require('mongoose');

const mentorshipSchema = new mongoose.Schema({
  mentor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  skills: [{
    type: String
  }],
  availability: {
    type: String,
    required: true
  },
  mode: {
    type: String,
    enum: ['online', 'offline', 'both'],
    default: 'online'
  },
  contactDetails: {
    type: String
  },
  status: {
    type: String,
    enum: ['Active', 'Closed'],
    default: 'Active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Mentorship', mentorshipSchema);
