import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mock-db';

/**
 * POST /api/v1/events/admin/withdrawals/[id]/status
 *
 * Update withdrawal request status (Admin action).
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, adminNotes } = body;

    const wdr = await db.withdrawals.findUnique(id);
    if (!wdr) {
      return NextResponse.json({ success: false, message: 'Withdrawal request not found' }, { status: 404 });
    }

    const updated = await db.withdrawals.update(id, {
      status,
      adminNotes
    });

    // If approved, update organizer's wallet withdrawn and available balance
    if (status === 'APPROVED' || status === 'COMPLETED') {
      const org = await db.organizers.findUnique(wdr.organizerId);
      if (org && org.wallet) {
        const amount = wdr.amount;
        const newAvailable = Math.max(0, org.wallet.availableBalance - amount);
        const newWithdrawn = org.wallet.withdrawnBalance + amount;
        await db.organizers.update(org.id, {
          wallet: {
            ...org.wallet,
            availableBalance: newAvailable,
            withdrawnBalance: newWithdrawn
          }
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Withdrawal request status updated successfully',
      data: updated
    });
  } catch (error) {
    console.error('Error in POST /api/v1/events/admin/withdrawals/[id]/status:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}
