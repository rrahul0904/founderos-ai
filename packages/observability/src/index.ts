export interface TelemetryEvent {
  name: string;
  projectId?: string;
  runId?: string;
  properties?: Record<string, string | number | boolean | null>;
  timestamp: string;
}

export function event(name: string, properties: Omit<TelemetryEvent, "name" | "timestamp"> = {}): TelemetryEvent {
  return { name, ...properties, timestamp: new Date().toISOString() };
}

export function emit(item: TelemetryEvent) {
  console.info(JSON.stringify({ type: "telemetry", ...item }));
}
