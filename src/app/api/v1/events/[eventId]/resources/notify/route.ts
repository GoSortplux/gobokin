import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mock-db';

/**
 * POST /api/v1/events/{eventId}/resources/notify
 * Notify guests about shared resources.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const body = await req.json();
    const { resourceIds } = body;

    if (!resourceIds || !Array.isArray(resourceIds) || resourceIds.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'resourceIds array is required',
      }, { status: 400 });
    }

    // Update notifiedAt for the selected resources
    const now = new Date().toISOString();
    for (const id of resourceIds) {
      await db.resources.update(id, { notifiedAt: now });
    }

    // SIMULATION: In a real application, this would trigger actual email/in-app notifications.

    // 1. Fetch all registrations for this event
    // const registrations = await db.registrations.findMany({ eventId });

    // 2. Get the resources to find out which ticket types have access
    const selectedResources = await Promise.all(
      resourceIds.map(id => db.resources.findUnique(id))
    );

    // 3. Collect unique ticket IDs that should be notified
    const allowedTicketIds = new Set<string>();
    selectedResources.forEach(r => {
      if (r && r.guestCategoryIds) {
        r.guestCategoryIds.forEach(id => allowedTicketIds.add(id));
      }
    });

    // 4. Identify recipients (Registrations that match allowed tickets)
    // const recipients = registrations.filter(reg =>
    //   allowedTicketIds.size === 0 || allowedTicketIds.has(reg.ticketId)
    // );

    console.log(`[SIMULATION] Identified ticket categories for notification: ${Array.from(allowedTicketIds).join(', ') || 'ALL'}`);
    console.log(`[SIMULATION] Sending bulk Email & In-App notifications to guests for event ${eventId}`);
    console.log(`[SIMULATION] Notification payload includes links to resources: ${selectedResources.map(r => r?.title).join(', ')}`);

    return NextResponse.json({
      success: true,
      message: 'Notifications sent successfully',
    });

  } catch (error) {
    console.error('Error in POST /api/v1/events/[eventId]/resources/notify:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
    }, { status: 500 });
  }
}
