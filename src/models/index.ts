import mongoose, { Schema, Document } from 'mongoose';

export interface ISubmission extends Document {
  url: string;
  creator_handle: string;
  format: string;
  created_at: Date;
}

export interface IJudge extends Document {
  name: string;
  password?: string;
  role: 'admin' | 'judge';
  requiresPasswordChange: boolean;
}

export interface IScore extends Document {
  submission_id: mongoose.Types.ObjectId;
  judge_id: mongoose.Types.ObjectId;
  accuracy: number;
  originality: number;
  culture: number;
  visuals: number;
  impact: number;
  total_score: number;
  comment?: string;
}

export interface IConfig extends Document {
  key: string;
  value: Date | string | null;
}

const SubmissionSchema: Schema = new Schema({
  url: { type: String, required: true, unique: true },
  creator_handle: { type: String, default: '' },
  format: { type: String, default: 'Unknown' },
  created_at: { type: Date, default: Date.now }
});

const JudgeSchema: Schema = new Schema({
  name: { type: String, required: true, unique: true },
  password: { type: String }, // optional because legacy judges might not have it yet, but handled in seed
  role: { type: String, enum: ['admin', 'judge'], default: 'judge' },
  requiresPasswordChange: { type: Boolean, default: true }
});

const ScoreSchema: Schema = new Schema({
  submission_id: { type: Schema.Types.ObjectId, ref: 'Submission', required: true },
  judge_id: { type: Schema.Types.ObjectId, ref: 'Judge', required: true },
  accuracy: { type: Number, required: true },
  originality: { type: Number, required: true },
  culture: { type: Number, required: true },
  visuals: { type: Number, required: true },
  impact: { type: Number, required: true },
  total_score: { type: Number, required: true },
  comment: { type: String }
});

ScoreSchema.index({ submission_id: 1, judge_id: 1 }, { unique: true });

const ConfigSchema: Schema = new Schema({
  key: { type: String, required: true, unique: true },
  value: { type: Schema.Types.Mixed, default: null }
});

export const Submission = mongoose.models.Submission || mongoose.model<ISubmission>('Submission', SubmissionSchema);
export const Judge = mongoose.models.Judge || mongoose.model<IJudge>('Judge', JudgeSchema);
export const Score = mongoose.models.Score || mongoose.model<IScore>('Score', ScoreSchema);
export const Config = mongoose.models.Config || mongoose.model<IConfig>('Config', ConfigSchema);
