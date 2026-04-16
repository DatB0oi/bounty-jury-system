import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Submission, Score } from '@/models/index';
import { verifyToken } from '@/lib/auth';

export async function GET() {
  try {
    await dbConnect();
    
    const submissions = await Submission.aggregate([
      {
        $lookup: {
          from: 'scores',
          localField: '_id',
          foreignField: 'submission_id',
          as: 'scores'
        }
      },
      {
        $project: {
          _id: 1,
          url: 1,
          creator_handle: 1,
          format: 1,
          created_at: 1,
          avg_score: { $avg: '$scores.total_score' },
          score_count: { $size: '$scores' }
        }
      },
      {
        $sort: { created_at: -1 }
      }
    ]);

    const mapped = submissions.map(s => ({ ...s, id: s._id }));

    return NextResponse.json(mapped);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const token = request.headers.get('cookie')?.split('jury_auth=')[1]?.split(';')[0];
    const payload = token ? await verifyToken(token) : null;
    
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can add submissions' }, { status: 403 });
    }

    const { url, creator_handle, format } = await request.json();
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    await dbConnect();

    try {
      const newSub = await Submission.create({
        url,
        creator_handle: creator_handle || null,
        format: format || 'Unknown'
      });
      return NextResponse.json({ success: true, id: newSub._id });
    } catch (dbError: any) {
      if (dbError.code === 11000) {
        return NextResponse.json({ error: 'This URL has already been submitted.' }, { status: 400 });
      }
      throw dbError;
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save submission' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const token = request.headers.get('cookie')?.split('jury_auth=')[1]?.split(';')[0];
    const payload = token ? await verifyToken(token) : null;
    
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can edit submissions' }, { status: 403 });
    }

    const { id, url, creator_handle, format } = await request.json();
    
    if (!id || !url) {
      return NextResponse.json({ error: 'ID and URL are required' }, { status: 400 });
    }

    await dbConnect();

    try {
      const updatedSub = await Submission.findByIdAndUpdate(
        id, 
        { url, creator_handle: creator_handle || null, format: format || 'Unknown' },
        { new: true }
      );
      if (!updatedSub) {
        return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, submission: updatedSub });
    } catch (dbError: any) {
      if (dbError.code === 11000) {
        return NextResponse.json({ error: 'This URL has already been submitted.' }, { status: 400 });
      }
      throw dbError;
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update submission' }, { status: 500 });
  }
}
