import api from './api';

export type InteractionType = 'IMPRESSION' | 'CLICK' | 'DETAIL_VIEW';

export interface InteractionMetadata {
  surface?: string;
  viewportRatio?: number;
  position?: number;
  source?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface Interaction {
  eventId: string;
  type: InteractionType;
  metadata?: InteractionMetadata;
}

class EventTrackingService {
  private impressionBuffer: Interaction[] = [];
  private bufferTimeout: NodeJS.Timeout | null = null;
  private readonly BUFFER_DELAY = 2000; // 2 seconds

  /**
   * Log an event interaction.
   * Impressions are buffered and sent in bulk.
   * Clicks and Detail Views are sent immediately.
   */
  logInteraction(eventId: string, type: InteractionType, metadata?: InteractionMetadata) {
    if (type === 'IMPRESSION') {
      this.queueImpression(eventId, metadata);
    } else {
      // For CLICK and DETAIL_VIEW, send immediately
      this.sendSingleInteraction(eventId, type, metadata);
    }
  }

  private queueImpression(eventId: string, metadata?: InteractionMetadata) {
    // Avoid duplicate impressions in the same buffer for the same event
    const alreadyQueued = this.impressionBuffer.some(
      (i) => i.eventId === eventId && i.type === 'IMPRESSION'
    );

    if (!alreadyQueued) {
      this.impressionBuffer.push({ eventId, type: 'IMPRESSION', metadata });
    }

    if (!this.bufferTimeout) {
      this.bufferTimeout = setTimeout(() => {
        this.flushImpressions();
      }, this.BUFFER_DELAY);
    }
  }

  private async flushImpressions() {
    if (this.impressionBuffer.length === 0) return;

    const interactions = [...this.impressionBuffer];
    this.impressionBuffer = [];
    this.bufferTimeout = null;

    try {
      await api.post('/events/interactions/bulk', { interactions });
    } catch (error) {
      console.error('Failed to send bulk impressions:', error);
    }
  }

  private async sendSingleInteraction(eventId: string, type: InteractionType, metadata?: InteractionMetadata) {
    try {
      await api.post(`/events/${eventId}/interaction`, { type, metadata });
    } catch (error) {
      console.error(`Failed to send ${type} interaction for event ${eventId}:`, error);
    }
  }
}

export const eventTracking = new EventTrackingService();
