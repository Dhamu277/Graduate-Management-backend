const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

// Load Models
const User = require('./models/User');
const Profile = require('./models/Profile');
const JobPost = require('./models/JobPost');
const Event = require('./models/Event');
const Mentorship = require('./models/Mentorship');

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected for Seeding...');

    // Clear collection
    await User.deleteMany();
    await Profile.deleteMany();
    await JobPost.deleteMany();
    await Event.deleteMany();
    await Mentorship.deleteMany();

    // Create Admin User
    const adminUser = await User.create({
      name: 'Admin System',
      rollNumber: 'ADMIN001',
      password: 'password123',
      role: 'Management'
    });
    await Profile.create({ user: adminUser._id, department: 'Admin', jobTitle: 'System Administrator' });

    // Create Graduate User
    const graduateUser = await User.create({
      name: 'John Doe',
      rollNumber: 'ALUM2020',
      password: 'password123',
      role: 'Graduate'
    });
    await Profile.create({ 
      user: graduateUser._id, 
      department: 'Computer Science', 
      batch: '2020',
      currentCompany: 'Google',
      jobTitle: 'Software Engineer',
      skills: ['React', 'Node.js', 'System Design']
    });

    // Create Student User
    const studentUser = await User.create({
      name: 'Jane Smith',
      rollNumber: 'STUD2024',
      password: 'password123',
      role: 'Student'
    });
    await Profile.create({ 
      user: studentUser._id, 
      department: 'Information Technology', 
      batch: '2025',
      skills: ['HTML', 'CSS', 'JavaScript']
    });

    // Create Sample Job Post
    await JobPost.create({
      title: 'Frontend Developer',
      company: 'Google',
      description: 'Looking for a fresh graduate with React.js skills to join our dynamic team.',
      skillsRequired: ['React', 'JavaScript', 'CSS'],
      experience: '0-2 Years',
      location: 'Bangalore, India',
      jobType: 'Full-time',
      salary: '12 LPA',
      postedBy: graduateUser._id
    });

    // Create Sample Mentorship
    await Mentorship.create({
      mentor: graduateUser._id,
      title: 'Cracking the Coding Interview',
      description: 'I will guide you through data structures and algorithms preparation strategies.',
      category: 'Interview Prep',
      skills: ['Algorithms', 'Java', 'Problem Solving'],
      availability: 'Weekends 10 AM - 12 PM',
      mode: 'online',
      contactDetails: 'john.doe@example.com'
    });

    // Create Sample Event
    await Event.create({
      name: 'Annual Alumni Meet 2026',
      description: 'Join us for a wonderful evening of networking and celebration with past graduates.',
      date: new Date('2026-12-15'),
      time: '18:00',
      venue: 'Main Campus Auditorium',
      organizer: adminUser._id,
      category: 'Reunion',
      registrationLimit: 200
    });

    console.log('Database successfully seeded with test data!');
    process.exit();

  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedDatabase();
