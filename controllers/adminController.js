const Announcement = require('../models/Announcement');
const User = require('../models/User');

// @desc    Get all announcements
// @route   GET /api/admin/announcements
// @access  Private
const getAnnouncements = async (req, res, next) => {
  try {
    const announcements = await Announcement.find()
      .populate('createdBy', 'name role')
      .sort({ isPinned: -1, createdAt: -1 });
    res.json(announcements);
  } catch (error) {
    next(error);
  }
};

// @desc    Create an announcement
// @route   POST /api/admin/announcements
// @access  Private (Management)
const createAnnouncement = async (req, res, next) => {
  try {
    const { title, description, priority, isPinned } = req.body;

    const announcement = await Announcement.create({
      title,
      description,
      priority,
      isPinned,
      createdBy: req.user._id
    });

    res.status(201).json(announcement);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an announcement
// @route   DELETE /api/admin/announcements/:id
// @access  Private (Management)
const deleteAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    await announcement.deleteOne();
    res.json({ message: 'Announcement removed' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users for admin management
// @route   GET /api/admin/users
// @access  Private (Management)
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new user
// @route   POST /api/admin/users
// @access  Private (Management)
const createUser = async (req, res, next) => {
  try {
    const { name, rollNumber, password, role } = req.body;

    const userExists = await User.findOne({ rollNumber });

    if (userExists) {
      return res.status(400).json({ message: 'User with this roll number already exists' });
    }

    const user = await User.create({
      name,
      rollNumber,
      password,
      role
    });

    if (user) {
      // Create associated profile
      const Profile = require('../models/Profile');
      await Profile.create({ user: user._id });

      res.status(201).json({
        _id: user._id,
        name: user.name,
        rollNumber: user.rollNumber,
        role: user.role
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update a user
// @route   PUT /api/admin/users/:id
// @access  Private (Management)
const updateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.name = req.body.name || user.name;
    user.rollNumber = req.body.rollNumber || user.rollNumber;
    user.role = req.body.role || user.role;

    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      rollNumber: updatedUser.rollNumber,
      role: updatedUser.role
    });
  } catch (error) {
    next(error);
  }
};


module.exports = {
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
  getAllUsers,
  createUser,
  updateUser
};
