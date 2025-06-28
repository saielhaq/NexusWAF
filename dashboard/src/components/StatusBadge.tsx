import React from 'react';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: 'online' | 'offline' | 'loading';
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const statusConfig = {
    online: {
      icon: CheckCircle,
      text: 'Online',
      className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    },
    offline: {
      icon: XCircle,
      text: 'Offline',
      className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    },
    loading: {
      icon: AlertCircle,
      text: 'Checking...',
      className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.className} ${className}`}>
      <Icon className="w-4 h-4 mr-2" />
      {config.text}
    </span>
  );
}