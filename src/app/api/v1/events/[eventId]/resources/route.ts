import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mock-db';

/**
 * GET /api/v1/events/{eventId}/resources
 * List shared resources for an event.
 *
 * Behavior:
 * - Guests: Only see resources they have access to based on their guest category (ticket type ID).
 * - Organizers/Staff/Admins: See all resources for the event.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;

    // In a real application, we would verify the JWT and get user roles/registrations.
    // Here we simulate getting the user info from headers or session.
    const userRole = req.headers.get('x-user-role') || 'guest';
    const guestTicketTypeIds = req.headers.get('x-guest-ticket-types')?.split(',') || [];

    const allResources = await db.resources.findMany({ eventId });

    const isAuthorized = ['organizer', 'staff', 'admin', 'super-admin', 'organizer-staff'].includes(userRole);

    if (isAuthorized) {
      return NextResponse.json({
        success: true,
        data: allResources,
      });
    }

    // Guest filtering
    const filteredResources = allResources.filter(resource => {
      // If resource is targeted to specific guest categories
      if (resource.guestCategoryIds && resource.guestCategoryIds.length > 0) {
        return resource.guestCategoryIds.some(id => guestTicketTypeIds.includes(id));
      }
      // If no guestCategoryIds specified, it's considered accessible to all guests
      return true;
    });

    return NextResponse.json({
      success: true,
      data: filteredResources,
    });

  } catch (error) {
    console.error('Error in GET /api/v1/events/[eventId]/resources:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
    }, { status: 500 });
  }
}

/**
 * POST /api/v1/events/{eventId}/resources
 * Upload a shared resource material metadata.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const body = await req.json();
    const {
      title,
      description,
      fileUrl,
      fileName,
      fileType,
      mimeType,
      fileSize,
      guestCategoryIds
    } = body;

    if (!title || !fileUrl) {
      return NextResponse.json({
        success: false,
        message: 'Title and fileUrl are required',
      }, { status: 400 });
    }

    const newResource = {
      id: crypto.randomUUID(),
      eventId,
      title,
      description: description || '',
      fileUrl,
      fileName: fileName || fileUrl.split('/').pop() || 'unknown',
      fileType: fileType || 'document',
      mimeType: mimeType || 'application/octet-stream',
      fileSize: fileSize || 0,
      guestCategoryIds: guestCategoryIds || [],
      createdAt: new Date().toISOString(),
    };

    const created = await db.resources.create(newResource);

    return NextResponse.json({
      success: true,
      data: created,
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/v1/events/[eventId]/resources:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
    }, { status: 500 });
  }
}
