import { NextResponse } from 'next/server';
import { db } from '@/lib/mock-db';

/**
 * GET /api/v1/events/my-organizer-profile/finance
 *
 * Get organizer level finance summary.
 */
export async function GET() {
  try {
    const organizer = await db.organizers.findUnique('550e8400-e29b-41d4-a716-446655440000');
    if (!organizer) {
      return NextResponse.json({ success: false, message: 'Organizer not found' }, { status: 404 });
    }

    const walletId = organizer.wallet?.id || 'a1b2c3d4-e5f6-4a5b-bc6d-7e8f9a0b1c2d';
    const recentTransactions = await db.transactions.findMany({ walletId });

    // Sort by date descending
    recentTransactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Calculate totals based on transactions or preset values
    let totalGross = 0;
    let totalCommission = 0;
    recentTransactions.forEach((tx) => {
      if (tx.type === 'TICKET_PURCHASE') {
        totalGross += tx.amount;
        totalCommission += tx.commission;
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        wallet: organizer.wallet,
        totals: {
          amount: totalGross,
          commission: totalCommission,
          netAmount: totalGross - totalCommission
        },
        transactionCount: recentTransactions.length,
        recentTransactions: recentTransactions.slice(0, 10)
      }
    });
  } catch (error) {
    console.error('Error in GET /api/v1/events/my-organizer-profile/finance:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}
