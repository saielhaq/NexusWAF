import { useState, useEffect, useCallback } from "react";
import { apiService } from "../services/api";
import { WAFStats, LogEntry, WAFStatus } from "../types";

export function useWAFStats() {
  const [stats, setStats] = useState<WAFStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    const response = await apiService.getStats();
    if (response.success && response.data) {
      setStats(response.data);
    } else {
      setError(response.error || "Failed to fetch stats");
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
}

export function useLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);

    const response = await apiService.getLogs();
    if (response.success && response.data) {
      setLogs(response.data);
    } else {
      setError(response.error || "Failed to fetch logs");
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [fetchLogs]);

  return { logs, loading, error, refetch: fetchLogs };
}

export function useWAFStatus() {
  const [status, setStatus] = useState<WAFStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError(null);

    const response = await apiService.getStatus();
    if (response.success && response.data) {
      setStatus(response.data);
    } else {
      setError(response.error || "Failed to fetch status");
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [fetchStatus]);

  return { status, loading, error, refetch: fetchStatus };
}
