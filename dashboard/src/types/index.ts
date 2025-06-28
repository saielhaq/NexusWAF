export interface WAFStats {
  totalBannedIPs: number;
  rateLimitConfig: {
    maxRequests: number;
    timeWindow: number;
    banDuration: number;
  };
  bannedIPs: string[];
}

export interface LogEntry {
  timestamp: string;
  ip: string;
  eventType:
    | "RATE_LIMIT_EXCEEDED"
    | "IP_BANNED"
    | "IP_UNBANNED"
    | "REQUEST_BLOCKED"
    | "REQUEST_ALLOWED";
  details: string;
}

export interface WAFStatus {
  running: boolean;
  uptime?: number;
  version?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface WAFConfig {
  maxRequests: number;
  timeWindow: number;
  banDuration: number;
  backendUrl: string;
}
