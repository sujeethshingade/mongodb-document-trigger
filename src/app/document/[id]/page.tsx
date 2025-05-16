'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AuditLog } from '@/lib/types';

export default function DocumentHistory({ params }: { params: { id: string } }) {
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedLog, setExpandedLog] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const documentId = params.id;

    useEffect(() => {
        fetchDocumentHistory();
    }, []);

    const fetchDocumentHistory = async () => {
        try {
            setRefreshing(true);
            const timestamp = Date.now();
            const cacheBuster = Math.random().toString(36).substring(2);
            const url = `/api/audit-logs?documentId=${documentId}&t=${timestamp}&cb=${cacheBuster}`;

            const response = await fetch(url, {
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0',
                },
                cache: 'no-store',
                next: { revalidate: 0 }
            });

            if (!response.ok) throw new Error('Failed to fetch document history');

            const data = await response.json();
            setAuditLogs(data);
        } catch (err) {
            console.error('Error fetching document history:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const formatDate = (dateString: string | Date) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short'
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

    const renderFieldValue = (value: any) => {
        if (value === null || value === undefined) {
            return <span className="text-gray-400">Not provided</span>;
        }

        if (typeof value === 'object') {
            if (Object.keys(value).length === 0) {
                return <span className="text-gray-400">Empty object</span>;
            }

            if ('AddressLine1' in value || 'AddressLine2' in value || 'City' in value) {
                const parts = [];
                if (value.AddressLine1) parts.push(value.AddressLine1);
                if (value.AddressLine2) parts.push(value.AddressLine2);
                if (value.City) parts.push(value.City);
                if (value.State) parts.push(value.State);
                if (value.Country) parts.push(value.Country);
                if (value.ZipCode) parts.push(value.ZipCode);

                return parts.length > 0 ? parts.join(', ') : <span className="text-gray-400">Empty address</span>;
            }

            return <span className="italic">Complex value</span>;
        }

        if (typeof value === 'boolean') {
            return value ? 'Yes' : 'No';
        }

        return String(value);
    };

    return (
        <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="bg-white shadow-md rounded-lg overflow-hidden">
                    <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 flex justify-between items-center">
                        <h1 className="text-xl font-semibold text-gray-800">
                            Document History
                        </h1>
                        <Link
                            href="/"
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            Back to Dashboard
                        </Link>
                    </div>

                    <div className="p-6">
                        <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                            <h2 className="text-lg font-medium text-gray-800 mb-2">
                                Document ID:
                            </h2>
                            <p className="font-mono text-sm bg-gray-100 p-2 rounded-lg break-all">
                                {documentId}
                            </p>
                        </div>

                        <div className="mb-4 flex justify-end">
                            <button
                                onClick={fetchDocumentHistory}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center"
                                disabled={refreshing}
                            >
                                {refreshing ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Refreshing...
                                    </>
                                ) : (
                                    'Refresh History'
                                )}
                            </button>
                        </div>

                        {loading ? (
                            <div className="text-center py-4">
                                <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-blue-600"></div>
                                <p className="mt-2 text-gray-500">Loading document history...</p>
                            </div>
                        ) : auditLogs.length === 0 ? (
                            <p className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                                No history found for this document.
                            </p>
                        ) : (
                            <div className="space-y-6">
                                {auditLogs.map((log) => (
                                    <div
                                        key={log._id}
                                        className="border border-gray-200 rounded-lg overflow-hidden shadow-sm"
                                    >
                                        <div className="px-4 py-3 bg-gray-50 flex justify-between items-center">
                                            <div className="flex items-center space-x-3">
                                                <span className={`px-2 py-1 text-xs rounded-full ${getOperationColor(log.operationType)}`}>
                                                    {log.operationType}
                                                </span>
                                                <span className="text-gray-500 text-sm">
                                                    {formatDate(log.timestamp)}
                                                </span>
                                            </div>
                                            <button
                                                className="text-blue-600 hover:text-blue-800"
                                                onClick={() => setExpandedLog(expandedLog === log._id ? null : log._id!)}
                                            >
                                                {expandedLog === log._id ? 'Hide Details' : 'View Details'}
                                            </button>
                                        </div>

                                        {expandedLog === log._id && (
                                            <div className="p-4 border-t border-gray-200">
                                                <div className="mb-4">
                                                    <h3 className="font-semibold text-gray-700 mb-2">Changed Fields:</h3>
                                                    <div className="flex flex-wrap gap-2">
                                                        {log.changedFields?.map((field, index) => (
                                                            <span key={index} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                                                {field}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="overflow-x-auto">
                                                    <table className="min-w-full border border-gray-200 rounded-lg">
                                                        <thead>
                                                            <tr className="bg-gray-50">
                                                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b">
                                                                    Field
                                                                </th>
                                                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b">
                                                                    Old Value
                                                                </th>
                                                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b">
                                                                    New Value
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-200">
                                                            {log.changedFields?.map((field, index) => {
                                                                const preValue = log.preImage ? log.preImage[field] : null;
                                                                const postValue = log.postImage ? log.postImage[field] : null;

                                                                return (
                                                                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                                                            {field}
                                                                        </td>
                                                                        <td className="px-4 py-3 text-sm text-gray-700">
                                                                            {renderFieldValue(preValue)}
                                                                        </td>
                                                                        <td className="px-4 py-3 text-sm text-gray-700">
                                                                            {renderFieldValue(postValue)}
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
} 