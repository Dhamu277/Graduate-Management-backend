const Event = require('../models/Event');
const EventRegistration = require('../models/EventRegistration');

// @desc    Get all events
// @route   GET /api/events
// @access  Private
const getEvents = async (req, res, next) => {
  try {
    const events = await Event.find()
      .populate('organizer', 'name role')
      .sort({ date: 1 });
    res.json(events);
  } catch (error) {
    next(error);
  }
};

// @desc    Create an event
// @route   POST /api/events
// @access  Private (Management)
const createEvent = async (req, res, next) => {
  try {
    const { name, description, date, time, venue, category, registrationLimit } = req.body;

    const event = await Event.create({
      name,
      description,
      date,
      time,
      venue,
      category,
      registrationLimit,
      organizer: req.user._id
    });

    res.status(201).json(event);
  } catch (error) {
    next(error);
  }
};

// @desc    Register for an event
// @route   POST /api/events/:id/register
// @access  Private
const registerForEvent = async (req, res, next) => {
  try {
    const eventId = req.params.id;
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const existingReg = await EventRegistration.findOne({ event: eventId, attendee: req.user._id });
    if (existingReg) {
      return res.status(400).json({ message: 'Already registered for this event' });
    }

    // Check limit
    if (event.registrationLimit) {
      const currentCount = await EventRegistration.countDocuments({ event: eventId });
      if (currentCount >= event.registrationLimit) {
        return res.status(400).json({ message: 'Event is full' });
      }
    }

    const registration = await EventRegistration.create({
      event: eventId,
      attendee: req.user._id,
      details: req.body.details
    });

    res.status(201).json(registration);
  } catch (error) {
    next(error);
  }
};

// @desc    Get event attendees (Admin only)
// @route   GET /api/events/:id/attendees
// @access  Private (Management)
const getEventAttendees = async (req, res, next) => {
  try {
    const attendees = await EventRegistration.find({ event: req.params.id })
      .populate('attendee', 'name email rollNumber role')
      .sort({ createdAt: -1 });
    
    res.json(attendees);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEvents,
  createEvent,
  registerForEvent,
  getEventAttendees
};
