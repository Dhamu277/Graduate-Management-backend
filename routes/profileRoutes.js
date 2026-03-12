const express = require('express');
const router = express.Router();
const { getProfileById, updateProfile, getProfiles } = require('../controllers/profileController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.route('/').get(protect, getProfiles);
router.route('/me').put(protect, updateProfile);

router.route('/upload-photo')
  .post(protect, upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file explicitly attached' });
      }
      const profile = await require('../models/Profile').findOne({ user: req.user._id });
      if (!profile) {
          return res.status(404).json({ message: 'Profile not found' });
      }
      
      const imagePath = `http://localhost:5000/uploads/profiles/${req.file.filename}`;
      profile.profileImage = imagePath;
      await profile.save();
      
      const User = require('../models/User');
      await User.findByIdAndUpdate(req.user._id, { profileImage: imagePath });

      res.status(200).json({ message: 'Image uploaded successfully', imagePath });
    } catch (error) {
       console.log(error);
       res.status(500).json({ message: 'Server error during upload' });
    }
  });

router.route('/:id').get(protect, getProfileById);

module.exports = router;
