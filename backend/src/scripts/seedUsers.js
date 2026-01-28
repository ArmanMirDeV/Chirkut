const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');

// Load env
dotenv.config({ path: path.join(__dirname, '../../.env') });

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('DB Connected for seeding...');

    const users = [
      {
        name: 'Mess Admin',
        email: 'admin@chirkut.com',
        password: 'password123',
        phone: '01711000001',
        role: 'admin'
      },
      {
        name: 'Mess Manager',
        email: 'manager@chirkut.com',
        password: 'password123',
        phone: '01711000002',
        role: 'manager'
      },
      {
        name: 'General User',
        email: 'user@chirkut.com',
        password: 'password123',
        phone: '01711000003',
        role: 'user'
      }
    ];

    for (const u of users) {
      const exists = await User.findOne({ email: u.email });
      if (exists) {
        console.log(`User ${u.email} already exists, skipping...`);
        continue;
      }
      await User.create(u);
      console.log(`Created ${u.role}: ${u.email}`);
    }

    console.log('Seeding completed!');
    process.exit();
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedUsers();
