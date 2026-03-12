const JobPost = require('../models/JobPost');
const JobApplication = require('../models/JobApplication');

// @desc    Get all jobs
// @route   GET /api/jobs
// @access  Private
const getJobs = async (req, res, next) => {
  try {
    const jobs = await JobPost.find({ isActive: true })
      .populate('postedBy', 'name role')
      .sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a job post
// @route   POST /api/jobs
// @access  Private (Graduate, Management)
const createJob = async (req, res, next) => {
  try {
    const { title, company, description, skillsRequired, experience, location, jobType, salary, deadline, applyLink } = req.body;

    const job = await JobPost.create({
      title,
      company,
      description,
      skillsRequired: Array.isArray(skillsRequired) ? skillsRequired : skillsRequired.split(',').map(s => s.trim()),
      experience,
      location,
      jobType,
      salary,
      deadline,
      applyLink,
      postedBy: req.user._id
    });

    res.status(201).json(job);
  } catch (error) {
    next(error);
  }
};

// @desc    Apply to a job
// @route   POST /api/jobs/:id/apply
// @access  Private (Student)
const applyToJob = async (req, res, next) => {
  try {
    const jobId = req.params.id;
    const existingApplication = await JobApplication.findOne({ job: jobId, applicant: req.user._id });

    if (existingApplication) {
      return res.status(400).json({ message: 'You have already applied to this job' });
    }

    const application = await JobApplication.create({
      job: jobId,
      applicant: req.user._id,
      resumeUrl: req.body.resumeUrl,
      coverLetter: req.body.coverLetter
    });

    res.status(201).json(application);
  } catch (error) {
    next(error);
  }
};

// @desc    Get applications for my job posts
// @route   GET /api/jobs/applications
// @access  Private (Graduate, Management)
const getMyJobApplications = async (req, res, next) => {
  try {
    const myJobs = await JobPost.find({ postedBy: req.user._id });
    const jobIds = myJobs.map(job => job._id);

    const applications = await JobApplication.find({ job: { $in: jobIds } })
      .populate('job', 'title company')
      .populate('applicant', 'name email rollNumber');

    res.json(applications);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a job post
// @route   DELETE /api/jobs/:id
// @access  Private (Creator only)
const deleteJob = async (req, res, next) => {
  try {
    const job = await JobPost.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if user is the creator
    if (job.postedBy.toString() !== req.user._id.toString() && req.user.role !== 'Management') {
      return res.status(401).json({ message: 'Not authorized to delete this job post' });
    }

    await job.deleteOne();
    res.json({ message: 'Job post removed' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getJobs,
  createJob,
  applyToJob,
  getMyJobApplications,
  deleteJob
};
