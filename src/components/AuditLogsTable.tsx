'use client';

import { useState, useEffect, useCallback } from 'react';
import { FieldAuditLog, LogFilter } from '@/lib/types';

interface AuditLogsTableProps {
    collection?: string;
    documentId?: string;
    showFilters?: boolean;
}

export default function AuditLogsTable({
    collection = 'users',
    documentId,
    showFilters = true
}: AuditLogsTableProps) {
    const [logs, setLogs] = useState<FieldAuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        total: 0,
        limit: 50,
        skip: 0,
        hasMore: false
    });

    const [filters, setFilters] = useState<LogFilter>({
        documentId: documentId || '',
        operationType: '',
        changedFields: '',
        updatedBy: ''
    });

    const [sortBy, setSortBy] = useState('timestamp');
    const [sortOrder, setSortOrder] = useState('desc');

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                collection,
                useFieldLogs: 'true',
                limit: pagination.limit.toString(),
                skip: pagination.skip.toString(),
                sortBy,
                sortOrder
            });

            // Add filters
            if (filters.documentId) params.append('documentId', filters.documentId);
            if (filters.operationType) params.append('operationType', filters.operationType);
            if (filters.changedFields) params.append('changedFields', filters.changedFields);
            if (filters.updatedBy) params.append('updatedBy', filters.updatedBy);

            const response = await fetch(`/api/audit-logs?${params}`);
            if (!response.ok) throw new Error('Failed to fetch logs');

            const data = await response.json();
            setLogs(data.data || []);
            setPagination(data.pagination || pagination);
        } catch (error) {
            console.error('Error fetching audit logs:', error);
        } finally {
            setLoading(false);
        }
    }, [collection, pagination.limit, pagination.skip, filters, sortBy, sortOrder]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const handleFilterChange = (field: keyof LogFilter, value: string) => {
        setFilters(prev => ({ ...prev, [field]: value }));
        setPagination(prev => ({ ...prev, skip: 0 })); // Reset to first page
    };

    const handleSort = (field: string) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('desc');
        }
        setPagination(prev => ({ ...prev, skip: 0 }));
    };

    const handlePageChange = (newSkip: number) => {
        setPagination(prev => ({ ...prev, skip: newSkip }));
    };

    const formatValue = (value: any) => {
        if (value === null || value === undefined) {
            return <span className="text-gray-400 italic">null</span>;
        }
        if (typeof value === 'boolean') {
            return value ? 'true' : 'false';
        }
        if (typeof value === 'object') {
            return <span className="text-gray-600 italic">Object</span>;
        }
        return String(value);
    };

    const formatDate = (dateString: string | Date) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            dateStyle: 'short',
            timeStyle: 'medium'
        }).format(date);
    };

    const getOperationColor = (operation: string) => {
        switch (operation) {
            case 'insert': return 'bg-green-100 text-green-800';
            case 'update': return 'bg-blue-100 text-blue-800';
            case 'delete': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getSortIcon = (field: string) => {
        if (sortBy !== field) {
            return <span className="text-gray-400">↕</span>;
        }
        return sortOrder === 'asc' ? <span className="text-blue-600">↑</span> : <span className="text-blue-600">↓</span>;
    };

    return (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                <h2 className="text-xl font-semibold text-gray-800">
                    {documentId ? `Document History - ${documentId}` : `Audit Logs - ${collection}`}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                    {pagination.total} total entries
                </p>
            </div>

            {showFilters && (
                <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Document ID
                            </label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                placeholder="Filter by document ID"
                                value={filters.documentId || ''}
                                onChange={(e) => handleFilterChange('documentId', e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Operation Type
                            </label>
                            <select
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                value={filters.operationType || ''}
                                onChange={(e) => handleFilterChange('operationType', e.target.value)}
                            >
                                <option value="">All Operations</option>
                                <option value="insert">Insert</option>
                                <option value="update">Update</option>
                                <option value="delete">Delete</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Changed Field
                            </label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                placeholder="Filter by field name"
                                value={filters.changedFields || ''}
                                onChange={(e) => handleFilterChange('changedFields', e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Updated By
                            </label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                placeholder="Filter by user"
                                value={filters.updatedBy || ''}
                                onChange={(e) => handleFilterChange('updatedBy', e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            )}

            <div className="p-6">
                {loading ? (
                    <div className="text-center py-4">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-muted border-t-foreground"></div>
                        <p className="mt-2 text-gray-500">Loading audit logs...</p>
                    </div>
                ) : logs.length === 0 ? (
                    <p className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                        No audit logs found.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() => handleSort('documentId')}
                                    >
                                        <div className="flex items-center space-x-1">
                                            <span>Document ID</span>
                                            {getSortIcon('documentId')}
                                        </div>
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() => handleSort('operationType')}
                                    >
                                        <div className="flex items-center space-x-1">
                                            <span>Operation</span>
                                            {getSortIcon('operationType')}
                                        </div>
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() => handleSort('changedFields')}
                                    >
                                        <div className="flex items-center space-x-1">
                                            <span>Changed Field</span>
                                            {getSortIcon('changedFields')}
                                        </div>
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Old Value
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        New Value
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() => handleSort('updatedBy')}
                                    >
                                        <div className="flex items-center space-x-1">
                                            <span>Updated By</span>
                                            {getSortIcon('updatedBy')}
                                        </div>
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() => handleSort('timestamp')}
                                    >
                                        <div className="flex items-center space-x-1">
                                            <span>Timestamp</span>
                                            {getSortIcon('timestamp')}
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {logs.map((log, index) => (
                                    <tr key={log._id || index} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm font-mono text-gray-900">
                                            {log.documentId}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <span className={`px-2 py-1 text-xs rounded-full ${getOperationColor(log.operationType)}`}>
                                                {log.operationType.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                            {log.changedFields}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            <div className="max-w-xs truncate">
                                                {formatValue(log.oldValue)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            <div className="max-w-xs truncate">
                                                {formatValue(log.newValue)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            {log.updatedBy}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {formatDate(log.timestamp)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4">
                            <div className="flex flex-1 justify-between sm:hidden">
                                <button
                                    onClick={() => handlePageChange(Math.max(0, pagination.skip - pagination.limit))}
                                    disabled={pagination.skip === 0}
                                    className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => handlePageChange(pagination.skip + pagination.limit)}
                                    disabled={!pagination.hasMore}
                                    className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm text-gray-700">
                                        Showing <span className="font-medium">{pagination.skip + 1}</span> to{' '}
                                        <span className="font-medium">
                                            {Math.min(pagination.skip + pagination.limit, pagination.total)}
                                        </span>{' '}
                                        of <span className="font-medium">{pagination.total}</span> results
                                    </p>
                                </div>
                                <div>
                                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                                        <button
                                            onClick={() => handlePageChange(Math.max(0, pagination.skip - pagination.limit))}
                                            disabled={pagination.skip === 0}
                                            className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <span className="sr-only">Previous</span>
                                            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handlePageChange(pagination.skip + pagination.limit)}
                                            disabled={!pagination.hasMore}
                                            className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <span className="sr-only">Next</span>
                                            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </nav>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
