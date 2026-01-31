import { NextRequest, NextResponse } from 'next/server';
import { syncRoadBlocks } from '@/lib/services/road-blocks-service';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  
  // Verify Cron Secret to prevent unauthorized access
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // In development, you might want to allow it without secret or utilize a local secret
    // strictly for testing purposes (e.g. if process.env.NODE_ENV === 'development')
    if (process.env.NODE_ENV !== 'development') {
       return new NextResponse('Unauthorized', { status: 401 });
    }
  }

  try {
    await syncRoadBlocks();
    return NextResponse.json({ success: true, message: 'Road blocks synced successfully' });
  } catch (error) {
    console.error('Cron synchronization failed:', error);
    return NextResponse.json({ success: false, error: 'Synchronization failed' }, { status: 500 });
  }
}
