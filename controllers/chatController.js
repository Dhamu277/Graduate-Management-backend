const ChatSession = require('../models/ChatSession');
const ChatMessage = require('../models/ChatMessage');
const Conversation = require('../models/Conversation');
const mongoose = require('mongoose');
const Message = require('../models/Message');
const Connection = require('../models/Connection');

// --- BOT CHAT ---

// @desc    Start/get a chat session (Bot)
// @route   GET /api/chat/session
// @access  Private
const getChatSession = async (req, res, next) => {
  try {
    let session = await ChatSession.findOne({ userId: req.user._id, status: 'Active' });

    if (!session) {
      session = await ChatSession.create({
        userId: req.user._id,
        status: 'Active'
      });
      
      // Auto-reply greeting
      await ChatMessage.create({
        chatSession: session._id,
        sender: 'Bot',
        text: `Hello ${req.user.name}! I am your Alumni Help Assistant. How can I help you today?`
      });
    }

    const messages = await ChatMessage.find({ chatSession: session._id }).sort({ createdAt: 1 });

    res.json({ session, messages });
  } catch (error) {
    next(error);
  }
};

// @desc    Send a message (Bot)
// @route   POST /api/chat/assistant/message
// @access  Private
const sendAssistantMessage = async (req, res, next) => {
  try {
    const { text, sessionId } = req.body;

    const session = await ChatSession.findById(sessionId);
    if (!session || session.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized for this session' });
    }

    // Save user message
    const userMessage = await ChatMessage.create({
      chatSession: session._id,
      sender: 'User',
      text
    });

    // Generate bot reply
    let botReplyText = "I'm sorry, I don't understand that right now. Try asking about jobs, mentorships, or events.";
    const lowerText = text.toLowerCase();

    if (lowerText.includes('job') || lowerText.includes('career')) {
      botReplyText = "You can find job posts by navigating to the Jobs portal in the sidebar. You can search, filter, and apply from there.";
    } else if (lowerText.includes('mentor')) {
      botReplyText = "Mentorship opportunities are available in the Mentorship module. You can request a mentor or offer mentorship if you are a Graduate.";
    } else if (lowerText.includes('event')) {
      botReplyText = "Check the Events section for upcoming alumni meets and workshops. You can register for an event directly.";
    } else if (lowerText.includes('profile')) {
      botReplyText = "To update your profile, go to the Profile section and click edit. Make sure to complete all fields so others can find you in the directory.";
    }

    const botMessage = await ChatMessage.create({
      chatSession: session._id,
      sender: 'Bot',
      text: botReplyText
    });

    res.status(201).json({ userMessage, botMessage });
  } catch (error) {
    next(error);
  }
};

// --- USER-TO-USER CHAT ---

// @desc    Get or create conversation between two users
// @route   POST /api/chat/conversation
// @access  Private
const getOrCreateConversation = async (req, res, next) => {
  try {
    const { receiverId } = req.body;
    const senderId = req.user._id;

    // Check if users are connected
    const connection = await Connection.findOne({
      status: 'accepted',
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId }
      ]
    });

    if (!connection) {
      return res.status(403).json({ message: "You can only chat with accepted connections" });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] }
    }).populate('participants', 'name profilePicture role');

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId]
      });
      conversation = await conversation.populate('participants', 'name profilePicture role');
    }

    res.json(conversation);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all messages for a conversation
// @route   GET /api/chat/messages/:conversationId
// @access  Private
// @desc    Get all messages for a conversation
// @route   GET /api/chat/messages/:conversationId
// @access  Private
const getConversationMessages = async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId);
    if (!conversation || !conversation.participants.includes(req.user._id)) {
      return res.status(403).json({ message: "Not authorized to view these messages" });
    }

    // Mark messages as read for this user
    await Message.updateMany(
      { conversationId: req.params.conversationId, senderId: { $ne: req.user._id }, isRead: false },
      { $set: { isRead: true } }
    );

    const messages = await Message.find({ conversationId: req.params.conversationId })
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    next(error);
  }
};

// @desc    Send a message to a conversation
// @route   POST /api/chat/message
// @access  Private
const sendMessage = async (req, res, next) => {
  try {
    const { conversationId, text } = req.body;
    const senderId = req.user._id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.includes(senderId)) {
      return res.status(403).json({ message: "Not authorized to send messages in this conversation" });
    }

    const message = await Message.create({
      conversationId,
      senderId,
      text,
      isRead: false
    });

    res.status(201).json(message);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all conversations for the logged in user
// @route   GET /api/chat/conversations
// @access  Private
const getUserConversations = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const conversations = await Conversation.find({
      participants: userId
    }).populate('participants', 'name profilePicture role');

    // Add unread count and last message to each conversation
    const conversationData = await Promise.all(conversations.map(async (conv) => {
      const unreadCount = await Message.countDocuments({
        conversationId: conv._id,
        senderId: { $ne: userId },
        isRead: false
      });

      const lastMessage = await Message.findOne({ conversationId: conv._id })
        .sort({ createdAt: -1 });

      return {
        ...conv._doc,
        unreadCount,
        lastMessage
      };
    }));

    res.json(conversationData);
  } catch (error) {
    next(error);
  }
};

// @desc    Get total unread messages count for logged in user
// @route   GET /api/chat/unread-count
// @access  Private
const getUnreadMessagesCount = async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    // Find all conversations the user is part of
    const conversations = await Conversation.find({ participants: userId });
    const conversationIds = conversations.map(c => c._id);

    const totalUnread = await Message.countDocuments({
      conversationId: { $in: conversationIds },
      senderId: { $ne: userId },
      isRead: false
    });

    res.json({ count: totalUnread });
  } catch (error) {
    next(error);
  }
};

// @desc    Clear bot chat session
// @route   DELETE /api/chat/session/:id
// @access  Private
const clearChatSession = async (req, res, next) => {
  try {
    const session = await ChatSession.findById(req.params.id);
    
    if (session && session.userId.toString() === req.user._id.toString()) {
      session.status = 'Closed';
      await session.save();
      
      res.json({ message: 'Session closed' });
    } else {
      res.status(404).json({ message: 'Session not found' });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get unread message counts grouped by sender for logged in user
// @route   GET /api/chat/unread-counts-per-sender
// @access  Private
const getUnreadCountsPerSender = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // 1. Find all conversations the user is a participant in
    const conversations = await Conversation.find({ participants: userId });
    
    // 2. For each conversation, find the OTHER participant and count unread messages from them
    const result = {};
    for (const conv of conversations) {
      const otherId = conv.participants.find(p => p.toString() !== userId.toString());
      if (otherId) {
        const count = await Message.countDocuments({
          conversationId: conv._id,
          senderId: otherId,
          isRead: false
        });
        if (count > 0) {
          result[otherId.toString()] = count;
        }
      }
    }

    console.log(`[DEBUG] Unread counts for user ${userId}:`, result);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getChatSession,
  sendAssistantMessage,
  getOrCreateConversation,
  getConversationMessages,
  sendMessage,
  getUserConversations,
  getUnreadMessagesCount,
  getUnreadCountsPerSender,
  clearChatSession
};
