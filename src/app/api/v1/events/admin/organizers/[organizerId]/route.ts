import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mock-db';

/**
 * GET /api/v1/events/admin/organizers/{organizerId}
 *
 * Get detailed organizer profile (Admin)
 * Consumed by: Super Admin
 * Retrieves the full organizer profile including wallet, bank account, and MongoDB user profile.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ organizerId: string }> }
) {
  try {
    const { organizerId } = await params;

    const organizer = await db.organizers.findUnique(organizerId);
    if (!organizer) {
      return NextResponse.json({
        success: false,
        message: 'Organizer not found',
      }, { status: 404 });
    }

    const user = await db.users.findUnique(organizer.mongoUserId);

    const detailedOrganizer = {
      ...organizer,
      userProfile: user ? {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
      } : null
    };

    return NextResponse.json({
      success: true,
      data: detailedOrganizer
    });

  } catch (error) {
    console.error('Error in GET /api/v1/events/admin/organizers/[organizerId]:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
    }, { status: 500 });
  }
}

/**
 * PATCH /api/v1/events/admin/organizers/{organizerId}
 *
 * Admin update organizer profile
 * Consumed by: Super Admin
 * Allows manual management of an organizer's status, verification, and financial rules.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ organizerId: string }> }
) {
  try {
    const { organizerId } = await params;
    const body = await req.json();

    const organizer = await db.organizers.findUnique(organizerId);
    if (!organizer) {
      return NextResponse.json({
        success: false,
        message: 'Organizer not found',
      }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};

    if (body.status !== undefined) updateData.status = body.status;
    if (body.isVerified !== undefined) updateData.isVerified = body.isVerified;
    if (body.commissionRate !== undefined) updateData.commissionRate = Number(body.commissionRate);
    if (body.payoutPolicy !== undefined) updateData.payoutPolicy = body.payoutPolicy;
    if (body.maxStaff !== undefined) updateData.maxStaff = Number(body.maxStaff);
    if (body.autoPromotionEligible !== undefined) updateData.autoPromotionEligible = body.autoPromotionEligible;
    if (body.adminNotes !== undefined) updateData.adminNotes = body.adminNotes;
    if (body.reason !== undefined && body.adminNotes === undefined) {
      // If only reason is provided, append or use it for notes
      updateData.adminNotes = `Reason: ${body.reason}`;
    }

    const updated = await db.organizers.update(organizerId, updateData);

    const user = await db.users.findUnique(organizer.mongoUserId);

    return NextResponse.json({
      success: true,
      data: {
        ...updated,
        userProfile: user ? {
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
        } : null
      }
    });

  } catch (error) {
    console.error('Error in PATCH /api/v1/events/admin/organizers/[organizerId]:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
    }, { status: 500 });
  }
}
