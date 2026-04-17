import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Judge, Submission, Score } from '@/models/index';

export async function GET() {
  try {
    await dbConnect();

    // 1. Get all judges
    const judges = await Judge.find({}, { name: 1, role: 1 }).lean();

    // 2. Get total number of submissions
    const totalSubmissions = await Submission.countDocuments();

    // 3. For each judge, count how many scores they have submitted
    const progress = await Promise.all(judges.map(async (judge) => {
      const ratedCount = await Score.countDocuments({ judge_id: judge._id });
      return {
        id: judge._id,
        name: judge.name,
        role: judge.role,
        rated: ratedCount,
        missing: totalSubmissions - ratedCount
      };
    }));

    return NextResponse.json({
      totalSubmissions,
      judges: progress
    });
  } catch (error) {
    console.error('Error fetching progress:', error);
    return NextResponse.json({ error: 'Failed to fetch judges progress' }, { status: 500 });
  }
}
