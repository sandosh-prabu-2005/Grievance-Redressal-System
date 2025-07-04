const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('./config');
const User = require('./models/User');
const Grievance = require('./models/Grievance');
const Message = require('./models/Message');

async function seed() {
  try {
    await mongoose.connect(config.mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('MongoDB connected for seeding');

    // Clear existing data
    await User.deleteMany();
    await Grievance.deleteMany();
    await Message.deleteMany();

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = new User({
      name: 'Admin User',
      email: 'admin@example.com',
      password: adminPassword,
      role: 'admin'
    });
    await admin.save();

    // Create student users
    const studentPassword = await bcrypt.hash('student123', 10);
    const student1 = new User({
      name: 'Student One',
      email: 'student1@example.com',
      password: studentPassword,
      role: 'student'
    });
    await student1.save();

    const student2 = new User({
      name: 'Student Two',
      email: 'student2@example.com',
      password: studentPassword,
      role: 'student'
    });
    await student2.save();

    // Create grievances
    const grievance1 = new Grievance({
      student: student1._id,
      title: 'Internet not working',
      description: 'The internet connection is not working in my dorm.',
      status: 'Pending'
    });
    await grievance1.save();

    const grievance2 = new Grievance({
      student: student2._id,
      title: 'Classroom AC not working',
      description: 'The air conditioner in classroom 3 is broken.',
      status: 'Pending'
    });
    await grievance2.save();

    // Create messages (conversation) for a grievance
    const message1 = new Message({
      grievance: grievance1._id,
      sender: admin._id,
      content: 'We are looking into this issue.'
    });
    await message1.save();

    const message2 = new Message({
      grievance: grievance1._id,
      sender: student1._id,
      content: 'Thank you for the update.'
    });
    await message2.save();

    console.log('Seeding completed');
    mongoose.disconnect();
  } catch (err) {
    console.error(err);
    mongoose.disconnect();
  }
}

seed();
