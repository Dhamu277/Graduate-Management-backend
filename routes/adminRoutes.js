const express = require('express');
const router = express.Router();
const { getAnnouncements, createAnnouncement, deleteAnnouncement, getAllUsers, createUser, updateUser } = require('../controllers/adminController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// Announcements can be viewed by anyone logged in, but created only by Management
router.route('/announcements')
  .get(protect, getAnnouncements)
  .post(protect, authorizeRoles('Management'), createAnnouncement);

router.route('/announcements/:id')
  .delete(protect, authorizeRoles('Management'), deleteAnnouncement);

// User management is strictly Management role
router.route('/users')
  .get(protect, authorizeRoles('Management'), getAllUsers)
  .post(protect, authorizeRoles('Management'), createUser);

router.route('/users/:id')
  .put(protect, authorizeRoles('Management'), updateUser);

module.exports = router;
