const express = require('express');
const router = express.Router();
const { getEvents, createEvent, registerForEvent, getEventAttendees } = require('../controllers/eventController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getEvents)
  .post(protect, authorizeRoles('Management'), createEvent);

router.route('/:id/attendees')
  .get(protect, authorizeRoles('Management'), getEventAttendees);

router.route('/:id/register')
  .post(protect, registerForEvent);

module.exports = router;
