const Mentorship = require('../models/Mentorship');
const MentorshipRequest = require('../models/MentorshipRequest');

// @desc    Get all mentorships
// @route   GET /api/mentorships
// @access  Private
const getMentorships = async (req, res, next) => {
  try {
    const mentorships = await Mentorship.find({ status: 'Active' })
      .populate('mentor', 'name role department currentCompany')
      .sort({ createdAt: -1 });
    res.json(mentorships);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a mentorship post
// @route   POST /api/mentorships
// @access  Private (Graduate, Management)
const createMentorship = async (req, res, next) => {
  try {
    const { title, description, category, skills, availability, mode, contactDetails } = req.body;

    const mentorship = await Mentorship.create({
      mentor: req.user._id,
      title,
      description,
      category,
      skills: Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim()),
      availability,
      mode,
      contactDetails,
      status: 'Active'
    });

    res.status(201).json(mentorship);
  } catch (error) {
    next(error);
  }
};

// @desc    Request a mentorship
// @route   POST /api/mentorships/:id/request
// @access  Private (Student)
const requestMentorship = async (req, res, next) => {
  try {
    const mentorshipId = req.params.id;
    const existingReq = await MentorshipRequest.findOne({ mentorship: mentorshipId, mentee: req.user._id });

    if (existingReq) {
      return res.status(400).json({ message: 'Mentorship request already sent' });
    }

    const mentorshipRequest = await MentorshipRequest.create({
      mentorship: mentorshipId,
      mentee: req.user._id,
      message: req.body.message
    });

    res.status(201).json(mentorshipRequest);
  } catch (error) {
    next(error);
  }
};

// @desc    Request a direct mentorship
// @route   POST /api/mentorships/request-direct/:mentorId
// @access  Private (Student)
const requestDirectMentorship = async (req, res, next) => {
  try {
    const mentorId = req.params.mentorId;
    
    // Check if a direct request is already pending
    const existingReq = await MentorshipRequest.findOne({ 
      directMentor: mentorId, 
      mentee: req.user._id,
      status: 'Pending'
    });

    if (existingReq) {
      return res.status(400).json({ message: 'A pending request already exists for this mentor.' });
    }

    const mentorshipRequest = await MentorshipRequest.create({
      directMentor: mentorId,
      mentee: req.user._id,
      message: req.body.message
    });

    res.status(201).json(mentorshipRequest);
  } catch (error) {
    next(error);
  }
};

// @desc    Get mentorship requests for mentor
// @route   GET /api/mentorships/requests
// @access  Private (Graduate)
const getMyRequests = async (req, res, next) => {
  try {
    // Find mentorships posted by this mentor
    const myMentorships = await Mentorship.find({ mentor: req.user._id });
    const mentorshipIds = myMentorships.map(m => m._id);

    // Find requests for these mentorship posts OR direct requests to this user
    const requests = await MentorshipRequest.find({ 
      $or: [
        { mentorship: { $in: mentorshipIds } },
        { directMentor: req.user._id }
      ]
    })
      .populate('mentorship', 'title')
      .populate('mentee', 'name email rollNumber');

    res.json(requests);
  } catch (error) {
    next(error);
  }
};

// @desc    Update request status
// @route   PUT /api/mentorships/requests/:id
// @access  Private (Graduate, Management)
const updateRequestStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const request = await MentorshipRequest.findById(req.params.id);

    if (request) {
      request.status = status;
      const updatedReq = await request.save();
      res.json(updatedReq);
    } else {
      res.status(404).json({ message: 'Request not found' });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get my applied requests
// @route   GET /api/mentorships/my-applications
// @access  Private (Student)
const getMyAppliedRequests = async (req, res, next) => {
  try {
    const requests = await MentorshipRequest.find({ mentee: req.user._id })
      .populate('mentorship', 'title mentor')
      .populate({
         path: 'mentorship',
         populate: { path: 'mentor', select: 'name' }
      })
      .populate('directMentor', 'name email role currentCompany');
    res.json(requests);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMentorships,
  createMentorship,
  requestMentorship,
  requestDirectMentorship,
  getMyRequests,
  updateRequestStatus,
  getMyAppliedRequests
};
