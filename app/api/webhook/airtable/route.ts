import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Required for static export compatibility
export const dynamic = 'force-static';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-airtable-signature');
    
    // Verify webhook signature if configured
    const webhookSecret = process.env.AIRTABLE_WEBHOOK_SECRET;
    if (webhookSecret && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(body)
        .digest('hex');
      
      if (signature !== expectedSignature) {
        console.warn('Invalid webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const data = JSON.parse(body);
    
    // Check if this is a radar-related change
    const isRadarChange = data.tableId === 'tbltJj6hqqNdbcJjT'; // Radar table ID
    
    if (isRadarChange) {
      console.log('Radar data changed, triggering regeneration...');
      
      // Here you could trigger a regeneration process
      // For now, we'll just log the change
      console.log('Webhook data:', {
        tableId: data.tableId,
        recordId: data.recordId,
        changeType: data.changeType,
        timestamp: data.timestamp
      });
      
      // In a production environment, you might:
      // 1. Trigger a build process
      // 2. Send a notification
      // 3. Update a cache
      // 4. Trigger deployment
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Webhook received',
      isRadarChange 
    });
    
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Webhook endpoint is active',
    instructions: 'Configure this URL in Airtable webhooks for automatic regeneration'
  });
} 