import React, { useState } from 'react';
import { Shield, Plus, Trash2, Search } from 'lucide-react';
import { useWAFStats } from '../hooks/useApi';
import { apiService } from '../services/api';
import { LoadingSpinner } from './LoadingSpinner';

export function BannedIPs() {
  const { stats, loading, error, refetch } = useWAFStats();
  const [newIP, setNewIP] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleBanIP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIP.trim()) return;

    setActionLoading(`ban-${newIP}`);
    
    try {
      const response = await apiService.banIP(newIP.trim());
      if (response.success) {
        setNewIP('');
        refetch();
      }
    } catch (error) {
      console.error('Failed to ban IP:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnbanIP = async (ip: string) => {
    setActionLoading(`unban-${ip}`);
    
    try {
      const response = await apiService.unbanIP(ip);
      if (response.success) {
        refetch();
      }
    } catch (error) {
      console.error('Failed to unban IP:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredIPs = stats?.bannedIPs?.filter(ip =>
    ip.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Banned IPs
        </h2>
        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
          <Shield className="w-4 h-4" />
          <span>{stats?.totalBannedIPs || 0} banned</span>
        </div>
      </div>

      {/* Add New IP */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Ban New IP Address
        </h3>
        <form onSubmit={handleBanIP} className="flex space-x-4">
          <input
            type="text"
            value={newIP}
            onChange={(e) => setNewIP(e.target.value)}
            placeholder="Enter IP address (e.g., 192.168.1.1)"
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            pattern="^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$"
            required
          />
          <button
            type="submit"
            disabled={actionLoading !== null || !newIP.trim()}
            className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors duration-200"
          >
            {actionLoading?.startsWith('ban-') ? (
              <LoadingSpinner size="sm" className="mr-2" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Ban IP
          </button>
        </form>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search banned IPs..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Banned IPs List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Currently Banned IPs
          </h3>
        </div>
        
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          ) : filteredIPs.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                {searchTerm ? 'No IPs match your search' : 'No banned IPs'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredIPs.map((ip) => (
                <div
                  key={ip}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="font-mono text-gray-900 dark:text-white">
                      {ip}
                    </span>
                  </div>
                  <button
                    onClick={() => handleUnbanIP(ip)}
                    disabled={actionLoading === `unban-${ip}`}
                    className="flex items-center px-3 py-1 text-sm bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-md font-medium transition-colors duration-200"
                  >
                    {actionLoading === `unban-${ip}` ? (
                      <LoadingSpinner size="sm" className="mr-1" />
                    ) : (
                      <Trash2 className="w-3 h-3 mr-1" />
                    )}
                    Unban
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}