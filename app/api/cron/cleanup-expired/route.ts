import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = createClient();
    
    // Check for authorization (e.g., Vercel Cron secret)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // Allow development testing or if secret is not set (be careful in prod)
      if (process.env.NODE_ENV === 'production' && process.env.CRON_SECRET) {
        return new NextResponse('Unauthorized', { status: 401 });
      }
    }

    // Delete items where expires_at < NOW()
    const { error, count } = await supabase
      .from('locations')
      .delete({ count: 'exact' })
      .lt('expires_at', new Date().toISOString());

    if (error) {
      console.error('Error cleaning up expired locations:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      deleted_count: count,
      message: `Successfully cleaned up ${count} expired locations`
    });
  } catch (error) {
    console.error('Cron job failed:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
