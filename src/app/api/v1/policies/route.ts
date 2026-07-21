import { NextResponse } from 'next/server';
import { db } from '@/lib/mock-db';

/**
 * GET /api/v1/policies
 *
 * Returns a list of the latest published versions of all unique policies
 * that have reached their effective date.
 */
export async function GET() {
  try {
    const policies = await db.policies.findMany();
    return NextResponse.json({
      statusCode: 200,
      success: true,
      message: 'Policies retrieved successfully',
      data: policies
    });
  } catch (error) {
    console.error('Error in GET /api/v1/policies:', error);
    return NextResponse.json({
      statusCode: 500,
      success: false,
      message: 'Internal server error',
    }, { status: 500 });
  }
}
