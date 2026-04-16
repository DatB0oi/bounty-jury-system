import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/bounty";

// Define the schema inline
const JudgeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  password: { type: String },
  role: { type: String, enum: ['admin', 'judge'], default: 'judge' },
  requiresPasswordChange: { type: Boolean, default: true }
});
const Judge = mongoose.models.Judge || mongoose.model('Judge', JudgeSchema);

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB.');

    await Judge.deleteMany({}); // Clear old judges to enforce new role schema

    // Specific judges
    const judgesList = [
      { name: 'DatBoi', role: 'admin' },
      { name: 'Luke152', role: 'judge' },
      { name: 'Lavender', role: 'judge' },
      { name: 'Feezy', role: 'judge' },
      { name: 'CryptoChimba', role: 'judge' },
      { name: 'Promise_Wils', role: 'judge' },
      { name: 'GRiim', role: 'judge' },
      { name: 'test', role: 'judge' }
    ];

    const defaultPassword = 'BountyTeam1!';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(defaultPassword, salt);

    for (const j of judgesList) {
      await Judge.create({ 
        name: j.name,
        password: hashedPassword,
        role: j.role,
        requiresPasswordChange: true
      });
    }

    console.log('Jury successfully seeded with Role-Based Access parameters.');
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    mongoose.disconnect();
  }
}

seed();
