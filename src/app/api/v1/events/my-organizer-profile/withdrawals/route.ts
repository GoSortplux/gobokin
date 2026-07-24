import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mock-db';

/**
 * GET /api/v1/events/my-organizer-profile/withdrawals
 *
 * Allows organizers to view and track all their past payouts,
 * including current state (PENDING, COMPLETED, REJECTED),
 * processing date, and adminNotes.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'ALL';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // Default organizerId to our main mock organizer (Tech Events Ltd)
    const organizerId = '550e8400-e29b-41d4-a716-446655440000';

    const withdrawals = await db.withdrawals.findMany({ organizerId, status });

    // Sort withdrawals by date descending (newest first)
    withdrawals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Pagination
    const total = withdrawals.length;
    const pages = Math.ceil(total / limit) || 1;
    const offset = (page - 1) * limit;
    const paginated = withdrawals.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      data: paginated,
      pagination: {
        total,
        page,
        limit,
        pages
      }
    });
  } catch (error) {
    console.error('Error in GET /api/v1/events/my-organizer-profile/withdrawals:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
    }, { status: 500 });
  }
}
