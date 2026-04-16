import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Score } from '@/models/index';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const submissionId = searchParams.get('submissionId');
    const judgeId = searchParams.get('judgeId');

    await dbConnect();
    
    let query: any = {};
    if (submissionId) query.submission_id = submissionId;
    if (judgeId) query.judge_id = judgeId;
    
    const scores = await Score.find(query);
    return NextResponse.json(scores);
  } catch (error) {
    console.error('Error fetching scores:', error);
    return NextResponse.json({ error: 'Failed to fetch scores' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { submission_id, judge_id, accuracy, originality, culture, visuals, impact } = body;
    
    if (!submission_id || !judge_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const total_score = parseInt(accuracy) + parseInt(originality) + parseInt(culture) + parseInt(visuals) + parseInt(impact);

    await dbConnect();
    
    // Upsert the score
    await Score.findOneAndUpdate(
      { submission_id, judge_id },
      { accuracy, originality, culture, visuals, impact, total_score },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, total_score });
  } catch (error) {
    console.error('Error submitting score:', error);
    return NextResponse.json({ error: 'Failed to save score' }, { status: 500 });
  }
}
