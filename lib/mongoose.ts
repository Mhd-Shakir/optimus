import mongoose from 'mongoose';
import { seedDefaultUsers } from '@/lib/seed'; // Import the script we wrote earlier

let isConnected = false;

export const connectToDB = async () => {
  mongoose.set('strictQuery', true);

  if (!process.env.MONGODB_URI) return console.log('MISSING MONGODB_URI');

  if (isConnected) return;

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    isConnected = true;
    console.log('MongoDB connected');

    // --- RUN SEEDER HERE ---
    // This checks and creates the default admin/team leaders if they don't exist
    await seedDefaultUsers(); 
    // -----------------------

  } catch (error) {
    console.log(error);
  }
};