import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mock-db';

/**
 * GET /api/v1/events/my-organizer-profile/finance/transactions
 *
 * List organizer wallet transactions.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || undefined;
    const status = searchParams.get('status') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // Get primary mock organizer
    const organizer = await db.organizers.findUnique('550e8400-e29b-41d4-a716-446655440000');
    const walletId = organizer?.wallet?.id || 'a1b2c3d4-e5f6-4a5b-bc6d-7e8f9a0b1c2d';

    const transactions = await db.transactions.findMany({
      walletId,
      type,
      status
    });

    // Sort by createdAt descending
    transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Pagination
    const total = transactions.length;
    const pages = Math.ceil(total / limit) || 1;
    const offset = (page - 1) * limit;
    const paginated = transactions.slice(offset, offset + limit);

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
    console.error('Error in GET /api/v1/events/my-organizer-profile/finance/transactions:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
    }, { status: 500 });
  }
}
