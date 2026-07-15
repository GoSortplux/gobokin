import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mock-db';

/**
 * GET /api/v1/events/admin/organizers
 *
 * List all organizers (Admin)
 * Consumed by: Super Admin
 * Retrieves all organizers with their active subscriptions/packages, bank accounts, wallets, and MongoDB user profile.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const status = searchParams.get('status') || 'ALL';
    const isVerifiedStr = searchParams.get('isVerified');
    const search = searchParams.get('search') || '';

    let isVerified: boolean | undefined = undefined;
    if (isVerifiedStr === 'true') isVerified = true;
    if (isVerifiedStr === 'false') isVerified = false;

    // Fetch organizers from db
    const organizers = await db.organizers.findMany({ status, isVerified, search });

    // Populate userProfile for each organizer
    const populated = await Promise.all(organizers.map(async (o) => {
      const user = await db.users.findUnique(o.mongoUserId);
      return {
        ...o,
        userProfile: user ? {
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
        } : null
      };
    }));

    // Pagination
    const total = populated.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginatedData = populated.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      data: paginatedData,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });

  } catch (error) {
    console.error('Error in GET /api/v1/events/admin/organizers:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
    }, { status: 500 });
  }
}
