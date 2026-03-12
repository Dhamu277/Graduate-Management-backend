const User = require('../models/User');
const Mentorship = require('../models/Mentorship');
const JobPost = require('../models/JobPost');
const Event = require('../models/Event');
const Announcement = require('../models/Announcement');
const Post = require('../models/Post');

// @desc    Get dashboard statistics and recent data
// @route   GET /api/dashboard
// @access  Private
const getDashboardData = async (req, res, next) => {
  try {
    // Analytics/Stats
    const totalUsers = await User.countDocuments();
    const totalAlumni = await User.countDocuments({ role: 'Graduate' });
    const totalStudents = await User.countDocuments({ role: 'Student' });
    const totalManagement = await User.countDocuments({ role: 'Management' });
    
    // Active Users (Assuming students and alumni are 'active')
    const activeUsers = totalStudents + totalAlumni;

    const totalMentorships = await Mentorship.countDocuments();
    const totalJobPosts = await JobPost.countDocuments();
    const totalEvents = await Event.countDocuments();
    const totalAnnouncements = await Announcement.countDocuments();
    const totalCommunityPosts = await Post.countDocuments();

    // Recent Activities Data
    const recentJobs = await JobPost.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('postedBy', 'name role');

    const recentMentorships = await Mentorship.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('mentor', 'name');

    const upcomingEvents = await Event.find({ status: 'Upcoming' })
      .sort({ date: 1 }) // Closest upcoming
      .limit(5);

    const recentAnnouncements = await Announcement.find()
      .sort({ pinned: -1, createdAt: -1 })
      .limit(5);

    // --- Time-based Calculations for Trends & Chart ---
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    const sixtyDaysAgo = new Date(now.getTime() - (60 * 24 * 60 * 60 * 1000));

    // Helper function to calculate percentage change
    const calculateTrend = async (Model) => {
      const currentPeriod = await Model.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
      const previousPeriod = await Model.countDocuments({ createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } });
      
      if (previousPeriod === 0) return currentPeriod > 0 ? '+100%' : '0%';
      const percentChange = Math.round(((currentPeriod - previousPeriod) / previousPeriod) * 100);
      return percentChange > 0 ? `+${percentChange}%` : `${percentChange}%`;
    };

    const userTrend = await calculateTrend(User);
    const jobTrend = await calculateTrend(JobPost);
    const eventTrend = await calculateTrend(Event);
    // For active users, let's just use the same user trend or calculate specifically. 
    // We'll use userTrend for simplicity, maybe slightly tweaked if we tracked logins
    const activeUserTrend = userTrend;

    // --- Chart Data: Last 6 Months of User Registrations ---
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1); // Start of the month 6 months ago

    const chartAgg = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: { 
            year: { $year: "$createdAt" }, 
            month: { $month: "$createdAt" } 
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    // Format aggregation into an array with Month Names (Jan, Feb, etc.)
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const chartDataMap = new Map();
    
    // Initialize last 6 months with 0
    for(let i=5; i>=0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      chartDataMap.set(`${d.getFullYear()}-${d.getMonth() + 1}`, { name: monthNames[d.getMonth()], value: 0 });
    }

    // Fill in actual data
    chartAgg.forEach(item => {
      const key = `${item._id.year}-${item._id.month}`;
      if(chartDataMap.has(key)) {
        chartDataMap.get(key).value = item.count;
      }
    });

    const engagementChartData = Array.from(chartDataMap.values());

    res.json({
      stats: {
        totalUsers,
        totalAlumni,
        totalStudents,
        totalManagement,
        activeUsers,
        totalMentorships,
        totalJobPosts,
        totalEvents,
        totalAnnouncements,
        totalCommunityPosts
      },
      trends: {
        userTrend,
        activeUserTrend,
        jobTrend,
        eventTrend
      },
      chartData: engagementChartData,
      recentData: {
        recentJobs,
        recentMentorships,
        upcomingEvents,
        recentAnnouncements
      }
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardData
};
