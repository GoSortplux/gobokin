import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mock-db';

/**
 * PATCH /api/v1/users/staff/{staffId}
 *
 * Update staff details and venue assignments
 * Allows a venue owner to update a staff member's profile and manage their assigned venues.
 *
 * Behavior:
 * - If hallIds is provided, it replaces the current assignments for this owner.
 * - If hallIds is an empty array [], the staff is removed from all your venues and unlinked from your account.
 * - If the staff member is unlinked from all their owners, their 'staff' role is automatically removed.
 */

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ staffId: string }> }
) {
  try {
    const { staffId } = await params;
    const body = await req.json();
    const { fullName, phone, hallIds } = body;

    // In a real application, we would verify the JWT and get the current owner's ID.
    // Here we simulate getting the owner ID from the request headers or session.
    const currentOwnerId = req.headers.get('x-owner-id') || 'owner-123';

    // 1. Verify that the staff member exists
    const staffMember = await db.users.findUnique(staffId);
    if (!staffMember) {
      return NextResponse.json({
        success: false,
        message: 'Staff member not found',
      }, { status: 404 });
    }

    // 2. Update Profile Information
    if (fullName || phone) {
      const updateData: { fullName?: string; phone?: string; role?: string[] } = {};
      if (fullName) updateData.fullName = fullName;
      if (phone) updateData.phone = phone;

      await db.users.update(staffId, updateData);
    }

    // 3. Manage Venue Assignments
    if (Array.isArray(hallIds)) {
      // First, remove all existing assignments for this staff member under this owner
      await db.assignments.deleteMany({ staffId, ownerId: currentOwnerId });

      if (hallIds.length > 0) {
        // Create new assignments
        const newAssignments = hallIds.map(hallId => ({
          staffId,
          ownerId: currentOwnerId,
          hallId
        }));
        await db.assignments.createMany(newAssignments);
      } else {
        // hallIds is [], so we've already removed the assignments (and unlinked by implication in this simple model)

        // Check if the staff member is still linked to ANY other owners
        const remainingAssignments = await db.assignments.findMany({ staffId });

        if (remainingAssignments.length === 0) {
          // If no other assignments/owners exist, remove the 'staff' role
          const currentRoles = staffMember.role || [];
          const newRoles = currentRoles.filter(role => role !== 'staff');

          if (newRoles.length !== currentRoles.length) {
            await db.users.update(staffId, { role: newRoles });
          }
        }
      }
    }

    // Return the updated staff member details
    const updatedStaff = await db.users.findUnique(staffId);

    return NextResponse.json({
      success: true,
      message: 'Staff updated successfully',
      data: updatedStaff
    }, { status: 200 });

  } catch (error) {
    console.error('Error in PATCH /api/v1/users/staff/[staffId]:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
    }, { status: 500 });
  }
}
