import React, { useState } from 'react';
import { Play, Square, RotateCcw, Activity, Shield, Clock } from 'lucide-react';
import { useWAFStats, useWAFStatus } from '../hooks/useApi';
import { apiService } from '../services/api';
import { LoadingSpinner } from './LoadingSpinner';
import { StatusBadge } from './StatusBadge';

export function Overview() {
  const { stats, loading: statsLoading, error: statsError, refetch: refetchStats } = useWAFStats();
  const { status, loading: statusLoading, error: statusError, refetch: refetchStatus } = useWAFStatus();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleAction = async (action: 'start' | 'stop' | 'restart') => {
    setActionLoading(action);
    
    try {
      let response;
      switch (action) {
        case 'start':
          response = await apiService.startWAF();
          break;
        case 'stop':
          response = await apiService.stopWAF();
          break;
        case 'restart':
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
    if (statusLoading) return 'loading';
    if (statusError || !status) return 'offline';
    return status.running ? 'online' : 'offline';
  };

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
            onClick={() => handleAction('start')}
            disabled={actionLoading !== null}
            className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors duration-200"
          >
            {actionLoading === 'start' ? (
              <LoadingSpinner size="sm" className="mr-2" />
            ) : (
              <Play className="w-4 h-4 mr-2" />
            )}
            Start WAF
          </button>
          
          <button
            onClick={() => handleAction('restart')}
            disabled={actionLoading !== null}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors duration-200"
          >
            {actionLoading === 'restart' ? (
              <LoadingSpinner size="sm" className="mr-2" />
            ) : (
              <RotateCcw className="w-4 h-4 mr-2" />
            )}
            Restart WAF
          </button>
          
          <button
            onClick={() => handleAction('stop')}
            disabled={actionLoading !== null}
            className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors duration-200"
          >
            {actionLoading === 'stop' ? (
              <LoadingSpinner size="sm" className="mr-2" />
            ) : (
              <Square className="w-4 h-4 mr-2" />
            )}
            Stop WAF
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  '—'
                ) : (
                  stats?.totalBannedIPs || 0
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Rate Limit Config */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Rate Limit
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {statsLoading ? (
                  <LoadingSpinner size="sm" />
                ) : statsError ? (
                  '—'
                ) : (
                  `${stats?.rateLimitConfig?.maxRequests || 0}/min`
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Ban Duration */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Ban Duration
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {statsLoading ? (
                  <LoadingSpinner size="sm" />
                ) : statsError ? (
                  '—'
                ) : (
                  `${stats?.rateLimitConfig?.banDuration || 0}m`
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Rate Limit Details */}
      {stats?.rateLimitConfig && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Rate Limit Configuration
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Max Requests</p>
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                {stats.rateLimitConfig.maxRequests}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Time Window</p>
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                {stats.rateLimitConfig.timeWindow} seconds
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Ban Duration</p>
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                {stats.rateLimitConfig.banDuration} minutes
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error States */}
      {(statsError || statusError) && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <p className="text-red-800 dark:text-red-200">
            {statsError || statusError}
          </p>
        </div>
      )}
    </div>
  );
}