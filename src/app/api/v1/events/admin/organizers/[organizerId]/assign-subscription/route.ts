import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mock-db';

/**
 * POST /api/v1/events/admin/organizers/{organizerId}/assign-subscription
 *
 * Manually assign a subscription to an organizer
 * Consumed by: Super Admin
 * Immediately grants an organizer access to a subscription package without requiring a gateway payment.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ organizerId: string }> }
) {
  try {
    const { organizerId } = await params;
    const body = await req.json();
    const { packageId } = body;

    if (!packageId) {
      return NextResponse.json({
        success: false,
        message: 'packageId is required',
      }, { status: 400 });
    }

    const organizer = await db.organizers.findUnique(organizerId);
    if (!organizer) {
      return NextResponse.json({
        success: false,
        message: 'Organizer not found',
      }, { status: 404 });
    }

    const pkg = await db.packages.findUnique(packageId);
    if (!pkg) {
      return NextResponse.json({
        success: false,
        message: 'Subscription package not found',
      }, { status: 404 });
    }

    const updated = await db.organizers.update(organizerId, {
      activeSubscription: {
        packageId: pkg.id,
        packageName: pkg.name,
        assignedAt: new Date().toISOString()
      }
    });

    return NextResponse.json({
      success: true,
      message: `Subscription package "${pkg.name}" assigned successfully.`,
      data: updated
    });

  } catch (error) {
    console.error('Error in POST /api/v1/events/admin/organizers/[organizerId]/assign-subscription:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
    }, { status: 500 });
  }
}
