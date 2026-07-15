import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mock-db';

/**
 * GET /api/v1/events/admin/config
 *
 * Get system-wide events configuration
 */
export async function GET() {
  try {
    const config = await db.config.findMany();
    return NextResponse.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Error in GET /api/v1/events/admin/config:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
    }, { status: 500 });
  }
}

/**
 * PATCH /api/v1/events/admin/config
 *
 * Update/Set a platform configuration key
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { key, value, description } = body;

    if (!key || value === undefined) {
      return NextResponse.json({
        success: false,
        message: 'key and value are required',
      }, { status: 400 });
    }

    const updated = await db.config.update(key, String(value), description);

    return NextResponse.json({
      success: true,
      data: updated
    });
  } catch (error) {
    console.error('Error in PATCH /api/v1/events/admin/config:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
    }, { status: 500 });
  }
}
