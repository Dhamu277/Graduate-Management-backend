const mongoose = require('mongoose');

const eventRegistrationSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  attendee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['Registered', 'Attended', 'Cancelled'],
    default: 'Registered'
  },
  details: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('EventRegistration', eventRegistrationSchema);
