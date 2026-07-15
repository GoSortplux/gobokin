import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mock-db';

/**
 * PATCH /api/v1/events/admin/packages/{packageId}
 *
 * Update a subscription package
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ packageId: string }> }
) {
  try {
    const { packageId } = await params;
    const body = await req.json();

    const pkg = await db.packages.findUnique(packageId);
    if (!pkg) {
      return NextResponse.json({
        success: false,
        message: 'Subscription package not found',
      }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.price !== undefined) updateData.price = Number(body.price);
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.isPublic !== undefined) updateData.isPublic = body.isPublic;
    if (body.durationDays !== undefined) updateData.durationDays = Number(body.durationDays);
    if (body.rules !== undefined) updateData.rules = body.rules;
    if (body.discountPercentage !== undefined) updateData.discountPercentage = Number(body.discountPercentage);

    const updated = await db.packages.update(packageId, updateData);

    return NextResponse.json({
      success: true,
      data: updated
    });

  } catch (error) {
    console.error('Error in PATCH /api/v1/events/admin/packages/[packageId]:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
    }, { status: 500 });
  }
}

/**
 * DELETE /api/v1/events/admin/packages/{packageId}
 *
 * Delete a subscription package
 * Consumed by: Admin. Deletion is only allowed if no organizers are currently subscribed to the package. Otherwise, mark it as inactive.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ packageId: string }> }
) {
  try {
    const { packageId } = await params;

    const pkg = await db.packages.findUnique(packageId);
    if (!pkg) {
      return NextResponse.json({
        success: false,
        message: 'Subscription package not found',
      }, { status: 404 });
    }

    const result = await db.packages.delete(packageId);

    if (!result) {
      return NextResponse.json({
        success: false,
        message: 'Failed to delete or update subscription package',
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      data: result
    });

  } catch (error) {
    console.error('Error in DELETE /api/v1/events/admin/packages/[packageId]:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
    }, { status: 500 });
  }
}
