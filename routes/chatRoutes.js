const express = require('express');
const router = express.Router();
const {
  getChatSession,
  sendAssistantMessage,
  getOrCreateConversation,
  getConversationMessages,
  sendMessage,
  getUserConversations,
  getUnreadMessagesCount,
  getUnreadCountsPerSender,
  clearChatSession
} = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

// Bot Chat Routes
router.route('/session')
  .get(protect, getChatSession);

router.route('/assistant/message')
  .post(protect, sendAssistantMessage);

router.route('/unread-count')
  .get(protect, getUnreadMessagesCount);

router.route('/unread-counts-per-sender')
  .get(protect, getUnreadCountsPerSender);

// User-to-User Chat Routes
router.route('/conversations')
  .get(protect, getUserConversations);

router.route('/conversation')
  .post(protect, getOrCreateConversation);

router.route('/messages/:conversationId')
  .get(protect, getConversationMessages);

router.route('/message')
  .post(protect, sendMessage);

router.route('/session/:id')
  .delete(protect, clearChatSession);

module.exports = router;
