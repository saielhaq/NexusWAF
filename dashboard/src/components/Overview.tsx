import React, { useState } from "react";
import { Play, Square, RotateCcw, Activity, Shield, Clock } from "lucide-react";
import { useWAFStats, useWAFStatus, useLogs } from "../hooks/useApi";
import { apiService } from "../services/api";
import { LoadingSpinner } from "./LoadingSpinner";
import { StatusBadge } from "./StatusBadge";

export function Overview() {
  const {
    stats,
    loading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useWAFStats();
  const {
    status,
    loading: statusLoading,
    error: statusError,
    refetch: refetchStatus,
  } = useWAFStatus();
  const { logs, loading: logsLoading, error: logsError } = useLogs();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleAction = async (action: "start" | "stop" | "restart") => {
    setActionLoading(action);

    try {
      let response;
      switch (action) {
        case "start":
          response = await apiService.startWAF();
          break;
        case "stop":
          response = await apiService.stopWAF();
          break;
        case "restart":
          response = await apiService.restartWAF();
          break;
      }

      if (response.success) {
        // Refresh status after action
        setTimeout(() => {
          refetchStatus();
          refetchStats();
        }, 1000);
      }
    } catch (error) {
      console.error(`Failed to ${action} WAF:`, error);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusDisplay = () => {
    if (statusLoading) return "loading";
    if (statusError || !status) return "offline";
    return status.running ? "online" : "offline";
  };

  // Get the latest 3 triggered protections (security events)
  const latestProtections = logs
    .filter(
      (log) =>
        log.eventType === "REQUEST_BLOCKED" ||
        log.eventType === "IP_BANNED" ||
        log.eventType === "XSS" ||
        log.eventType === "SQL_INJECTION" ||
        log.eventType === "PATH_TRAVERSAL" ||
        log.eventType === "SSRF"
    )
    .slice(0, 3);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Overview
        </h2>
        <StatusBadge status={getStatusDisplay()} />
      </div>

      {/* Action Buttons */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          WAF Controls
        </h3>
        <div className="flex space-x-4">
          <button
            onClick={() => handleAction("start")}
            disabled={actionLoading !== null}
            className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors duration-200"
          >
            {actionLoading === "start" ? (
              <LoadingSpinner size="sm" className="mr-2" />
            ) : (
              <Play className="w-4 h-4 mr-2" />
            )}
            Start WAF
          </button>

          <button
            onClick={() => handleAction("restart")}
            disabled={actionLoading !== null}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors duration-200"
          >
            {actionLoading === "restart" ? (
              <LoadingSpinner size="sm" className="mr-2" />
            ) : (
              <RotateCcw className="w-4 h-4 mr-2" />
            )}
            Restart WAF
          </button>

          <button
            onClick={() => handleAction("stop")}
            disabled={actionLoading !== null}
            className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors duration-200"
          >
            {actionLoading === "stop" ? (
              <LoadingSpinner size="sm" className="mr-2" />
            ) : (
              <Square className="w-4 h-4 mr-2" />
            )}
            Stop WAF
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {/* Banned IPs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg">
              <Shield className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Banned IPs
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {statsLoading ? (
                  <LoadingSpinner size="sm" />
                ) : statsError ? (
                  "—"
                ) : (
                  stats?.totalBannedIPs || 0
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Latest Triggered Protections */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Latest Triggered Protections
          </h3>
          {logsLoading ? (
            <LoadingSpinner size="sm" />
          ) : logsError ? (
            <p className="text-red-600 dark:text-red-400">{logsError}</p>
          ) : latestProtections.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">
              No recent security events
            </p>
          ) : (
            <ul className="space-y-2">
              {latestProtections.map((log, idx) => (
                <li key={idx} className="text-sm text-gray-900 dark:text-white">
                  <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                  <br />
                  <span className="font-semibold">
                    {log.eventType.replace(/_/g, " ")}
                  </span>{" "}
                  from <span className="font-mono">{log.ip}</span>
                  {log.details && <span>: {log.details}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Error States */}
      {(statsError || statusError || logsError) && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <p className="text-red-800 dark:text-red-200">
            {statsError || statusError || logsError}
          </p>
        </div>
      )}
    </div>
  );
}
