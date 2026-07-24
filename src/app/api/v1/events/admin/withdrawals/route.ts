import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mock-db';

/**
 * GET /api/v1/events/admin/withdrawals
 *
 * List and paginate all withdrawal requests.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'ALL';
    const organizerId = searchParams.get('organizerId') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const withdrawals = await db.withdrawals.findMany({ organizerId, status });

    // Populate organizer details
    const populated = await Promise.all(withdrawals.map(async (wdr) => {
      const org = await db.organizers.findUnique(wdr.organizerId);
      let fullName = 'N/A';
      let email = 'N/A';

      if (org) {
        const user = await db.users.findUnique(org.mongoUserId);
        if (user) {
          fullName = user.fullName;
          email = user.email;
        }
      }

      return {
        ...wdr,
        organizer: {
          fullName,
          email
        }
      };
    }));

    // Sort withdrawals by date descending (newest first)
    populated.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Pagination
    const total = populated.length;
    const pages = Math.ceil(total / limit) || 1;
    const offset = (page - 1) * limit;
    const paginated = populated.slice(offset, offset + limit);

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
    console.error('Error in GET /api/v1/events/admin/withdrawals:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
    }, { status: 500 });
  }
}
