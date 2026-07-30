import dotenv from 'dotenv';
import User from './services/auth-service/User';

dotenv.config();

async function run() {
  const uri = process.env.MONGODB_PROPERTY_URI;
  console.log('Using connection string:', uri ? uri.replace(/:([^@]+)@/, ':****@') : 'undefined');
  
  try {
    const newUser = new User({
      id: 'usr_test_' + Date.now(),
      email: 'test_insert_' + Date.now() + '@gmail.com',
      full_name: 'Insert Diagnostic User',
      phone: '1234567890',
      role: 'student'
    });
    
    console.log('Attempting to save user document...');
    const result = await newUser.save();
    console.log('Successfully saved to database! Resulting document:', result);
    process.exit(0);
  } catch (error) {
    console.error('Failed to save to database. Error details:', error);
    process.exit(1);
  }
}

run();
