import { WAFStats, LogEntry, WAFStatus, ApiResponse } from "../types";

const WAF_API_BASE = "http://localhost:8080/admin";
const CONTROLLER_API_BASE = "http://localhost:9000";

class ApiService {
  private async fetchWithError<T>(
    url: string,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options?.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error("API Error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  // WAF Admin API
  async getStats(): Promise<ApiResponse<WAFStats>> {
    return this.fetchWithError<WAFStats>(`${WAF_API_BASE}/stats`);
  }

  async getLogs(): Promise<ApiResponse<LogEntry[]>> {
    return this.fetchWithError<LogEntry[]>(`${WAF_API_BASE}/logs`);
  }

  async banIP(ip: string): Promise<ApiResponse<void>> {
    return this.fetchWithError<void>(`${WAF_API_BASE}/ban/${ip}`, {
      method: "POST",
    });
  }

  async unbanIP(ip: string): Promise<ApiResponse<void>> {
    return this.fetchWithError<void>(`${WAF_API_BASE}/unban/${ip}`, {
      method: "POST",
    });
  }

  async getConfig(): Promise<ApiResponse<any>> {
    return this.fetchWithError<any>(`${WAF_API_BASE}/config`);
  }

  async updateConfig(config: any): Promise<ApiResponse<any>> {
    return this.fetchWithError<any>(`${WAF_API_BASE}/config`, {
      method: "POST",
      body: JSON.stringify(config),
    });
  }

  // Controller API
  async getStatus(): Promise<ApiResponse<WAFStatus>> {
    return this.fetchWithError<WAFStatus>(`${CONTROLLER_API_BASE}/status`);
  }

  async startWAF(): Promise<ApiResponse<void>> {
    return this.fetchWithError<void>(`${CONTROLLER_API_BASE}/start`, {
      method: "POST",
    });
  }

  async stopWAF(): Promise<ApiResponse<void>> {
    return this.fetchWithError<void>(`${CONTROLLER_API_BASE}/stop`, {
      method: "POST",
    });
  }

  async restartWAF(): Promise<ApiResponse<void>> {
    return this.fetchWithError<void>(`${CONTROLLER_API_BASE}/restart`, {
      method: "POST",
    });
  }
}

export const apiService = new ApiService();
