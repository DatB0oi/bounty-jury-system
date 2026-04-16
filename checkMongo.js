import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI;

const JudgeSchema = new mongoose.Schema({
  name: { type: String },
  password: { type: String },
  role: { type: String },
  requiresPasswordChange: { type: Boolean }
});
const Judge = mongoose.models.Judge || mongoose.model('Judge', JudgeSchema);

async function check() {
  await mongoose.connect(MONGODB_URI);
  const judges = await Judge.find({});
  console.log('Judges:', judges);
  
  const datBoi = await Judge.findOne({ name: 'DatBoi' });
  if (datBoi) {
    const isMatch = await bcrypt.compare('BountyTeam1!', datBoi.password);
    console.log('Password match:', isMatch);
  }
  
  process.exit(0);
}

check();
