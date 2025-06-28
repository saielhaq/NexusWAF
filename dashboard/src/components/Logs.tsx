import React, { useState } from 'react';
import { FileText, Filter, RefreshCw } from 'lucide-react';
import { useLogs } from '../hooks/useApi';
import { LoadingSpinner } from './LoadingSpinner';
import { LogEntry } from '../types';

const EVENT_TYPE_COLORS = {
  RATE_LIMIT_EXCEEDED: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  IP_BANNED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  IP_UNBANNED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  REQUEST_BLOCKED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  REQUEST_ALLOWED: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
};

export function Logs() {
  const { logs, loading, error, refetch } = useLogs();
  const [filterType, setFilterType] = useState<string>('');
  const [searchIP, setSearchIP] = useState('');

  const filteredLogs = logs.filter(log => {
    const matchesType = !filterType || log.eventType === filterType;
    const matchesIP = !searchIP || log.ip.includes(searchIP);
    return matchesType && matchesIP;
  });

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getEventTypeBadge = (eventType: LogEntry['eventType']) => {
    const colorClass = EVENT_TYPE_COLORS[eventType];
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
        {eventType.replace(/_/g, ' ')}
      </span>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Logs
        </h2>
        <div className="flex items-center space-x-4">
          <button
            onClick={refetch}
            disabled={loading}
            className="flex items-center px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors duration-200"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <FileText className="w-4 h-4" />
            <span>{filteredLogs.length} entries</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Filter by Event Type
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Events</option>
              <option value="RATE_LIMIT_EXCEEDED">Rate Limit Exceeded</option>
              <option value="IP_BANNED">IP Banned</option>
              <option value="IP_UNBANNED">IP Unbanned</option>
              <option value="REQUEST_BLOCKED">Request Blocked</option>
              <option value="REQUEST_ALLOWED">Request Allowed</option>
            </select>
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Filter by IP Address
            </label>
            <input
              type="text"
              value={searchIP}
              onChange={(e) => setSearchIP(e.target.value)}
              placeholder="Enter IP address..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  IP Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Event Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center">
                    <LoadingSpinner size="lg" />
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center">
                    <p className="text-red-600 dark:text-red-400">{error}</p>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center">
                    <FileText className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      {searchIP || filterType ? 'No logs match your filters' : 'No logs available'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {formatTimestamp(log.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 dark:text-white">
                      {log.ip}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getEventTypeBadge(log.eventType)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}