import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mock-db';

/**
 * GET /api/v1/events/admin/packages
 *
 * List subscription packages (Admin/Public)
 */
export async function GET() {
  try {
    const packages = await db.packages.findMany();
    return NextResponse.json({
      success: true,
      data: packages
    });
  } catch (error) {
    console.error('Error in GET /api/v1/events/admin/packages:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
    }, { status: 500 });
  }
}

/**
 * POST /api/v1/events/admin/packages
 *
 * Create subscription package (Admin)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, price, durationDays, type, rules, discountPercentage } = body;

    if (!name || price === undefined || !durationDays) {
      return NextResponse.json({
        success: false,
        message: 'Name, price, and durationDays are required',
      }, { status: 400 });
    }

    const newPackage = await db.packages.create({
      name,
      price: Number(price),
      durationDays: Number(durationDays),
      type: type || 'SUBSCRIPTION',
      isActive: true,
      isPublic: true,
      rules: rules || [],
      discountPercentage: Number(discountPercentage) || 0
    });

    return NextResponse.json({
      success: true,
      data: newPackage
    });
  } catch (error) {
    console.error('Error in POST /api/v1/events/admin/packages:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
    }, { status: 500 });
  }
}
