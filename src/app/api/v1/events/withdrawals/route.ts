import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mock-db';

/**
 * POST /api/v1/events/withdrawals
 *
 * Submit a withdrawal request from organizer portal.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, bankDetails } = body;

    const organizerId = '550e8400-e29b-41d4-a716-446655440000';
    const org = await db.organizers.findUnique(organizerId);
    if (!org) {
      return NextResponse.json({ success: false, message: 'Organizer not found' }, { status: 404 });
    }

    if (!amount || amount <= 0) {
      return NextResponse.json({ success: false, message: 'Invalid withdrawal amount' }, { status: 400 });
    }

    if (amount > (org.wallet?.availableBalance || 0)) {
      return NextResponse.json({ success: false, message: 'Insufficient wallet balance' }, { status: 400 });
    }

    // Determine bank account to use (passed or from organizer bankAccount)
    const bankAccount = {
      bankName: bankDetails?.bankName || org.bankAccount?.bankName || 'Default Bank',
      accountNumber: bankDetails?.accountNumber || org.bankAccount?.accountNumber || '0000000000',
      accountName: bankDetails?.accountName || org.bankAccount?.accountName || 'Organizer Name',
    };

    // Create withdrawal request in db
    const wdr = await db.withdrawals.create({
      organizerId,
      amount,
      status: 'PENDING',
      bankAccount,
      adminNotes: ''
    });

    // Create a pending wallet transaction for record tracking
    const walletId = org.wallet?.id || 'a1b2c3d4-e5f6-4a5b-bc6d-7e8f9a0b1c2d';
    await db.transactions.create({
      walletId,
      type: 'WITHDRAWAL',
      amount,
      commission: 0,
      netAmount: -amount,
      balanceBefore: org.wallet?.availableBalance || 0,
      balanceAfter: (org.wallet?.availableBalance || 0) - amount,
      status: 'PENDING',
      reference: `WD-${Date.now()}`,
      description: `Withdrawal request of ₦${amount.toLocaleString()} to ${bankAccount.bankName}`,
      isSettled: false
    });

    return NextResponse.json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      data: wdr
    });
  } catch (error) {
    console.error('Error in POST /api/v1/events/withdrawals:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}
