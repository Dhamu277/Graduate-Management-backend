const Profile = require('../models/Profile');
const User = require('../models/User');

// @desc    Get all profiles (Alumni Directory)
// @route   GET /api/profiles
// @access  Private
const getProfiles = async (req, res, next) => {
  try {
    const filters = {};
    if (req.query.role) filters.role = req.query.role;

    // First find users matching the role
    const users = await User.find(filters).select('_id name role rollNumber');
    const userIds = users.map(u => u._id);

    // Then find their profiles
    const profiles = await Profile.find({ user: { $in: userIds } })
      .populate('user', 'name role rollNumber');

    // Additional filtering based on profile fields
    let filteredProfiles = profiles;
    if (req.query.department) {
      filteredProfiles = filteredProfiles.filter(p => p.department === req.query.department);
    }
    if (req.query.batch) {
      filteredProfiles = filteredProfiles.filter(p => p.batch === req.query.batch);
    }
    if (req.query.company) {
      filteredProfiles = filteredProfiles.filter(p => p.currentCompany && p.currentCompany.toLowerCase().includes(req.query.company.toLowerCase()));
    }

    res.json(filteredProfiles);
  } catch (error) {
    next(error);
  }
};

// @desc    Get profile by user ID
// @route   GET /api/profiles/:userId
// @access  Private
const getProfileById = async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ user: req.params.id }).populate('user', 'name role rollNumber');

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.json(profile);
  } catch (error) {
    next(error);
  }
};

// @desc    Update profile
// @route   PUT /api/profiles/me
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ user: req.user._id });

    if (profile) {
      profile.email = req.body.email || profile.email;
      profile.phone = req.body.phone || profile.phone;
      profile.department = req.body.department || profile.department;
      profile.batch = req.body.batch || profile.batch;
      profile.currentCompany = req.body.currentCompany || profile.currentCompany;
      profile.jobTitle = req.body.jobTitle || profile.jobTitle;
      
      // Handle skills array
      if (req.body.skills) {
        profile.skills = Array.isArray(req.body.skills) 
          ? req.body.skills 
          : req.body.skills.split(',').map(skill => skill.trim());
      }
      
      profile.bio = req.body.bio || profile.bio;
      profile.linkedIn = req.body.linkedIn || profile.linkedIn;
      profile.gitHub = req.body.gitHub || profile.gitHub;
      profile.portfolio = req.body.portfolio || profile.portfolio;
      profile.location = req.body.location || profile.location;
      
      // For image upload, if path provides it
      if (req.body.profileImage) {
        profile.profileImage = req.body.profileImage;
      }

      const updatedProfile = await profile.save();
      
      // Update User name if provided
      if (req.body.name) {
          const user = await User.findById(req.user._id);
          user.name = req.body.name;
          await user.save();
      }

      const fullProfile = await Profile.findById(updatedProfile._id).populate('user', 'name role rollNumber');
      res.json(fullProfile);
    } else {
      res.status(404).json({ message: 'Profile not found' });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfiles,
  getProfileById,
  updateProfile
};
