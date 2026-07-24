import { NextResponse } from 'next/server';
import { db } from '@/lib/mock-db';

/**
 * GET /api/v1/events/admin/finance/summary
 *
 * Get system financial summary.
 */
export async function GET() {
  try {
    const organizers = await db.organizers.findMany();

    let totalPending = 0;
    let totalAvailable = 0;
    let totalWithdrawn = 0;

    const topOrganizers = organizers.map((org) => {
      const pending = org.wallet?.pendingBalance || 0;
      const available = org.wallet?.availableBalance || 0;
      const withdrawn = org.wallet?.withdrawnBalance || 0;

      totalPending += pending;
      totalAvailable += available;
      totalWithdrawn += withdrawn;

      return {
        id: org.wallet?.id || `w-${org.id}`,
        organizerId: org.id,
        pendingBalance: pending,
        availableBalance: available,
        withdrawnBalance: withdrawn,
        currency: org.wallet?.currency || 'NGN',
        organizer: {
          id: org.id,
          mongoUserId: org.mongoUserId,
          slug: org.website ? org.website.split('//')[1]?.split('.')[0] || 'slug' : 'slug',
          status: org.status,
          isVerified: org.isVerified,
          bio: org.bio,
          website: org.website,
          socialLinks: {
            twitter: 'https://x.com/techorg',
            instagram: 'https://instagram.com/techorg'
          },
          commissionRate: org.commissionRate,
          payoutPolicy: org.payoutPolicy || 'POST_EVENT',
          autoPromotionEligible: org.autoPromotionEligible || false,
          maxStaff: org.maxStaff,
          defaultRefundType: org.defaultRefundType,
          defaultRefundPercentage: org.defaultRefundPercentage,
          defaultRefundCutoffDays: org.defaultRefundCutoffDays,
          defaultRefundPolicy: 'No refunds within 72 hours of the event.',
          createdAt: '2025-01-15T09:00:00.000Z',
          updatedAt: '2026-04-01T10:20:30.000Z'
        }
      };
    });

    // Calculate gross amount, platform commission and net organizer amount
    // Let's assume average platform commission is 5% across the total volume
    const grossVolume = totalAvailable + totalPending + totalWithdrawn;
    const estimatedCommission = grossVolume * 0.05;
    const netAmount = grossVolume - estimatedCommission;

    return NextResponse.json({
      success: true,
      data: {
        totals: {
          amount: grossVolume,
          commission: estimatedCommission,
          netAmount: netAmount
        },
        totalWithdrawals: totalWithdrawn,
        organizerCount: organizers.length,
        topOrganizers
      }
    });
  } catch (error) {
    console.error('Error in GET /api/v1/events/admin/finance/summary:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
    }, { status: 500 });
  }
}
