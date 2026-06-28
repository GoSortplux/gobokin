import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mock-db';

/**
 * DELETE /api/v1/events/{eventId}/resources/{resourceId}
 * Delete a shared resource.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string, resourceId: string }> }
) {
  try {
    const { resourceId } = await params;

    const resource = await db.resources.findUnique(resourceId);

    if (!resource) {
      return NextResponse.json({
        success: false,
        message: 'Resource not found',
      }, { status: 404 });
    }

    // SIMULATION: In a real application, we would delete the file from R2 here.
    // Example:
    // const s3Client = new S3Client({...});
    // await s3Client.send(new DeleteObjectCommand({ Bucket: 'resources', Key: resource.fileName }));
    console.log(`[SIMULATION] Deleting file from R2: ${resource.fileUrl}`);

    await db.resources.delete(resourceId);

    return NextResponse.json({
      success: true,
      message: 'Resource deleted successfully',
    });

  } catch (error) {
    console.error('Error in DELETE /api/v1/events/[eventId]/resources/[resourceId]:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
    }, { status: 500 });
  }
}
