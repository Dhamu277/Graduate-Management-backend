const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  email: {
    type: String
  },
  phone: {
    type: String
  },
  department: {
    type: String
  },
  batch: {
    type: String
  },
  currentCompany: {
    type: String
  },
  jobTitle: {
    type: String
  },
  skills: [{
    type: String
  }],
  bio: {
    type: String
  },
  linkedIn: {
    type: String
  },
  gitHub: {
    type: String
  },
  portfolio: {
    type: String
  },
  location: {
    type: String
  },
  profileImage: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Profile', profileSchema);
