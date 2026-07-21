import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mock-db';

/**
 * GET /api/v1/policies/{slug}
 *
 * Returns the latest published and effective version of the policy identified by the slug.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const policy = await db.policies.findBySlug(slug);

    if (!policy) {
      return NextResponse.json({
        statusCode: 404,
        success: false,
        message: 'Policy not found',
      }, { status: 404 });
    }

    return NextResponse.json({
      statusCode: 200,
      success: true,
      message: 'Policy retrieved successfully',
      data: policy
    });
  } catch (error) {
    console.error('Error in GET /api/v1/policies/[slug]:', error);
    return NextResponse.json({
      statusCode: 500,
      success: false,
      message: 'Internal server error',
    }, { status: 500 });
  }
}
