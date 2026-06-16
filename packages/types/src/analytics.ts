export interface AnalyticsEventPayload {
  eventName: string;
  userId?: string;
  sessionId?: string;
  properties: Record<string, any>;
  timestamp?: number;
  source?: "web" | "admin" | "api" | "worker";
}
