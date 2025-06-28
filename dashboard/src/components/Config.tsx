import React, { useEffect, useState } from "react";
import { apiService } from "../services/api";
import { WAFConfig } from "../types";
import { LoadingSpinner } from "./LoadingSpinner";

export function Config() {
  const [config, setConfig] = useState<WAFConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function fetchConfig() {
      setLoading(true);
      setError(null);
      const response = await apiService.getConfig();
      if (response.success && response.data) {
        setConfig(response.data);
      } else {
        setError(response.error || "Failed to load config");
      }
      setLoading(false);
    }
    fetchConfig();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!config) return;
    const { name, value } = e.target;
    setConfig({
      ...config,
      [name]: name === "backendUrl" ? value : Number(value),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;
    setSaving(true);
    setError(null);
    setSuccess(false);
    const response = await apiService.updateConfig(config);
    if (response.success) {
      setSuccess(true);
    } else {
      setError(response.error || "Failed to save config");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600 dark:text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        Configuration
      </h2>
      <form
        onSubmit={handleSubmit}
        className="space-y-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Max Requests
          </label>
          <input
            type="number"
            name="maxRequests"
            value={config?.maxRequests ?? ""}
            onChange={handleChange}
            min={1}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Time Window (seconds)
          </label>
          <input
            type="number"
            name="timeWindow"
            value={config?.timeWindow ?? ""}
            onChange={handleChange}
            min={1}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Ban Duration (minutes)
          </label>
          <input
            type="number"
            name="banDuration"
            value={config?.banDuration ?? ""}
            onChange={handleChange}
            min={1}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Backend URL (website to protect)
          </label>
          <input
            type="text"
            name="backendUrl"
            value={config?.backendUrl ?? ""}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            required
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors duration-200"
        >
          {saving ? "Saving..." : "Save Configuration"}
        </button>
        {success && (
          <div className="text-green-600 dark:text-green-400 text-center mt-2">
            Configuration saved!
          </div>
        )}
      </form>
    </div>
  );
}
