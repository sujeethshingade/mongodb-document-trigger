'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AuditLog } from '@/lib/types';

export default function DocumentHistory({ params }: { params: { id: string } }) {
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [expandedLogs, setExpandedLogs] = useState<Record<string, boolean>>({});
    const [userEmail, setUserEmail] = useState<string | null>(null);

    const documentId = params.id;

    useEffect(() => {
        fetchDocumentHistory();
        fetchUserInfo();
    }, []);

    const fetchUserInfo = async () => {
        try {
            const response = await fetch(`/api/users/${documentId}`);

            if (response.ok) {
                const userData = await response.json();
                if (userData && userData.email) {
                    setUserEmail(userData.email);
                }
            }
        } catch (err) {
            console.error('Error fetching user information:', err);
        }
    };

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

            const responseData = await response.json();
            setAuditLogs(responseData.data || []);

            if (!userEmail && responseData.data && responseData.data.length > 0) {
                const logs = responseData.data;
                for (const log of logs) {
                    if (log.postImage && log.postImage.email) {
                        setUserEmail(log.postImage.email);
                        break;
                    } else if (log.preImage && log.preImage.email) {
                        setUserEmail(log.preImage.email);
                        break;
                    }
                }
            }

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

    const toggleExpandLog = (logId: string) => {
        setExpandedLogs(prev => ({
            ...prev,
            [logId]: !prev[logId]
        }));
    };

    const renderFieldValue = (value: any, isPreImage: boolean, operationType: string) => {
        if (value === null || value === undefined) {
            if (operationType === 'insert' && isPreImage) {
                return <span className="text-green-600 font-medium">New Document</span>;
            }
            if (operationType === 'delete' && !isPreImage) {
                return <span className="text-red-600 font-medium">Document Deleted</span>;
            }
            return <span className="text-gray-400">Empty</span>;
        }

        if (typeof value === 'object') {
            if (Object.keys(value).length === 0) {
                return <span className="text-gray-400">Empty</span>;
            }

            if ('AddressLine1' in value || 'AddressLine2' in value || 'City' in value) {
                const parts = [];
                if (value.AddressLine1) parts.push(value.AddressLine1);
                if (value.AddressLine2) parts.push(value.AddressLine2);
                if (value.City) parts.push(value.City);
                if (value.State) parts.push(value.State);
                if (value.Country) parts.push(value.Country);
                if (value.ZipCode) parts.push(value.ZipCode);

                return parts.length > 0 ? parts.join(', ') : <span className="text-gray-400">Empty</span>;
            }

            return <span className="italic">Complex value</span>;
        }

        if (typeof value === 'boolean') {
            return value ? 'Yes' : 'No';
        }

        return String(value);
    };

    return (
        <div className="w-full py-6 px-4">
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 flex justify-between items-center">
                    <h1 className="text-xl font-semibold text-gray-800">
                        Document History
                    </h1>
                    <Link
                        href="/"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        Back
                    </Link>
                </div>

                <div className="p-6">
                    <div className="flex flex-row gap-4">
                        <p className="font-mono text-sm break-all text-gray-600">
                            <span className="font-semibold">Document ID:</span> {documentId}
                        </p>
                        {userEmail && (
                            <p className="text-sm break-all text-gray-600">
                                <span className="font-semibold">Email:</span> {userEmail}
                            </p>
                        )}
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
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Operation
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Timestamp
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Changed Fields
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {auditLogs.map((log) => (
                                        <React.Fragment key={log._id}>
                                            <tr className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 text-xs rounded-full ${getOperationColor(log.operationType)}`}>
                                                        {log.operationType}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {formatDate(log.timestamp)}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    <div className="flex flex-wrap gap-1">
                                                        {log.changedFields?.map((field, idx) => (
                                                            <span key={idx} className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded">
                                                                {field}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button
                                                        onClick={() => toggleExpandLog(log._id!)}
                                                        className="text-blue-600 hover:text-blue-900"
                                                    >
                                                        {expandedLogs[log._id!] ? 'Hide Details' : 'View Details'}
                                                    </button>
                                                </td>
                                            </tr>
                                            {expandedLogs[log._id!] && (
                                                <tr>
                                                    <td colSpan={4} className="px-6 py-4 bg-gray-50">
                                                        <div className="overflow-x-auto border border-gray-200 rounded-lg">
                                                            <table className="min-w-full divide-y divide-gray-200">
                                                                <thead className="bg-gray-100">
                                                                    <tr>
                                                                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                            Field
                                                                        </th>
                                                                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                            Previous Value
                                                                        </th>
                                                                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                            New Value
                                                                        </th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="bg-white divide-y divide-gray-200">
                                                                    {log.changedFields?.map((field, idx) => {
                                                                        const preValue = log.preImage ? log.preImage[field] : null;
                                                                        const postValue = log.postImage ? log.postImage[field] : null;
                                                                        return (
                                                                            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                                                <td className="px-4 py-2 text-sm font-medium text-gray-900">
                                                                                    {field}
                                                                                </td>
                                                                                <td className="px-4 py-2 text-sm text-gray-700">
                                                                                    {renderFieldValue(preValue, true, log.operationType)}
                                                                                </td>
                                                                                <td className="px-4 py-2 text-sm text-gray-700">
                                                                                    {renderFieldValue(postValue, false, log.operationType)}
                                                                                </td>
                                                                            </tr>
                                                                        );
                                                                    })}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 