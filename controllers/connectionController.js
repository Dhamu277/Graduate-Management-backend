const Connection = require('../models/Connection');
const User = require('../models/User');

// @desc    Send connection request
// @route   POST /api/connections/request
// @access  Private
const sendRequest = async (req, res, next) => {
  try {
    const { receiverId } = req.body;
    const senderId = req.user._id;

    if (senderId.toString() === receiverId.toString()) {
      return res.status(400).json({ message: "You cannot connect with yourself" });
    }

    // Check if already connected or request pending
    const existingConnection = await Connection.findOne({
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId }
      ]
    });

    if (existingConnection) {
      return res.status(400).json({ message: "Connection already exists or is pending" });
    }

    const connection = await Connection.create({
      senderId,
      receiverId,
      status: 'pending'
    });

    res.status(201).json(connection);
  } catch (error) {
    next(error);
  }
};

// @desc    Accept connection request
// @route   PUT /api/connections/accept/:requestId
// @access  Private
const acceptRequest = async (req, res, next) => {
  try {
    const connection = await Connection.findById(req.params.requestId);

    if (!connection) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (connection.receiverId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to accept this request" });
    }

    connection.status = 'accepted';
    await connection.save();

    res.json(connection);
  } catch (error) {
    next(error);
  }
};

// @desc    Reject connection request
// @route   PUT /api/connections/reject/:requestId
// @access  Private
const rejectRequest = async (req, res, next) => {
  try {
    const connection = await Connection.findById(req.params.requestId);

    if (!connection) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (connection.receiverId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to reject this request" });
    }

    connection.status = 'rejected';
    await connection.save();

    res.json({ message: "Request rejected" });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove connection
// @route   DELETE /api/connections/remove/:connectionId
// @access  Private
const removeConnection = async (req, res, next) => {
  try {
    const connection = await Connection.findById(req.params.connectionId);

    if (!connection) {
      return res.status(404).json({ message: "Connection not found" });
    }

    if (
      connection.senderId.toString() !== req.user._id.toString() &&
      connection.receiverId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Not authorized to remove this connection" });
    }

    await connection.deleteOne();

    res.json({ message: "Connection removed" });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all accepted connections
// @route   GET /api/connections/:userId
// @access  Private
const getConnections = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const connections = await Connection.find({
      status: 'accepted',
      $or: [
        { senderId: userId },
        { receiverId: userId }
      ]
    }).populate('senderId receiverId', 'name email role profilePicture');

    // Return only the "other" user in the connection
    const friends = connections.map(conn => {
      return conn.senderId._id.toString() === userId.toString() ? conn.receiverId : conn.senderId;
    });

    res.json(friends);
  } catch (error) {
    next(error);
  }
};

// @desc    Get pending connection requests
// @route   GET /api/connections/requests/:userId
// @access  Private
const getRequests = async (req, res, next) => {
  try {
    const requests = await Connection.find({
      receiverId: req.params.userId,
      status: 'pending'
    }).populate('senderId', 'name email role profilePicture');

    res.json(requests);
  } catch (error) {
    next(error);
  }
};

// @desc    Get connection count
// @route   GET /api/connections/count/:userId
// @access  Private
const getConnectionCount = async (req, res, next) => {
  try {
    const count = await Connection.countDocuments({
      status: 'accepted',
      $or: [
        { senderId: req.params.userId },
        { receiverId: req.params.userId }
      ]
    });

    res.json({ count });
  } catch (error) {
    next(error);
  }
};

// @desc    Check connection status between two users
// @route   GET /api/connections/status/:targetUserId
// @access  Private
const getStatus = async (req, res, next) => {
  try {
    const { targetUserId } = req.params;
    const senderId = req.user._id;

    const connection = await Connection.findOne({
      $or: [
        { senderId, receiverId: targetUserId },
        { senderId: targetUserId, receiverId: senderId }
      ]
    });

    if (!connection) {
      return res.json({ status: 'none' });
    }

    if (connection.status === 'accepted') {
      return res.json({ status: 'accepted', connectionId: connection._id });
    }

    if (connection.status === 'pending') {
      if (connection.senderId.toString() === senderId.toString()) {
        return res.json({ status: 'pending', requestId: connection._id });
      } else {
        return res.json({ status: 'incoming_pending', requestId: connection._id });
      }
    }

    res.json({ status: 'none' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendRequest,
  acceptRequest,
  rejectRequest,
  removeConnection,
  getConnections,
  getRequests,
  getConnectionCount,
  getStatus
};
