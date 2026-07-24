import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mock-db';

/**
 * GET /api/v1/events/my-organizer-profile/finance/ledger
 *
 * List organizer double-entry ledger postings.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const source = searchParams.get('source') || undefined;
    const transactionId = searchParams.get('transactionId') || undefined;
    const reference = searchParams.get('reference') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const organizerId = '550e8400-e29b-41d4-a716-446655440000';

    const batches = await db.ledger.findMany({
      organizerId,
      source,
      transactionId,
      reference,
      startDate,
      endDate
    });

    // Populate transaction for each batch
    const populated = await Promise.all(batches.map(async (batch) => {
      const tx = await db.transactions.findUnique(batch.transactionId);
      return {
        ...batch,
        transaction: tx || undefined
      };
    }));

    // Sort by createdAt descending
    populated.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Pagination
    const total = populated.length;
    const pages = Math.ceil(total / limit) || 1;
    const offset = (page - 1) * limit;
    const paginated = populated.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      data: paginated,
      pagination: {
        total,
        page,
        limit,
        pages
      }
    });
  } catch (error) {
    console.error('Error in GET /api/v1/events/my-organizer-profile/finance/ledger:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
    }, { status: 500 });
  }
}
