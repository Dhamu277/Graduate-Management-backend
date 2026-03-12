const express = require('express');
const router = express.Router();
const {
  sendRequest,
  acceptRequest,
  rejectRequest,
  removeConnection,
  getConnections,
  getRequests,
  getConnectionCount,
  getStatus
} = require('../controllers/connectionController');
const { protect } = require('../middleware/authMiddleware');

router.post('/request', protect, sendRequest);
router.put('/accept/:requestId', protect, acceptRequest);
router.put('/reject/:requestId', protect, rejectRequest);
router.delete('/remove/:connectionId', protect, removeConnection);
router.get('/:userId', protect, getConnections);
router.get('/requests/:userId', protect, getRequests);
router.get('/count/:userId', protect, getConnectionCount);
router.get('/status/:targetUserId', protect, getStatus);

module.exports = router;
