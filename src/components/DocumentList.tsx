'use client';

import { useEffect, useState } from 'react';
import { AuditLog } from '@/lib/types';
import Link from 'next/link';

interface PaginationInfo {
    total: number;
    limit: number;
    skip: number;
    hasMore: boolean;
}

interface ApiResponse {
    data: AuditLog[];
    pagination: PaginationInfo;
}

interface DocumentListProps {
    auditLogs: AuditLog[];
    loading: boolean;
}

interface DocumentInfo {
    id: string;
    email: string | null;
}

export default function DocumentList({ auditLogs, loading }: DocumentListProps) {
    const [documentInfo, setDocumentInfo] = useState<DocumentInfo[]>([]);

    useEffect(() => {
        extractDocumentInfo();
    }, [auditLogs]);

    const extractDocumentInfo = () => {
        const idMap = new Map<string, DocumentInfo>();

        auditLogs.forEach(log => {
            if (log.documentId && log.documentId !== 'unknown') {
                if (!idMap.has(log.documentId)) {
                    idMap.set(log.documentId, {
                        id: log.documentId,
                        email: null
                    });
                }

                if (log.postImage && log.postImage.email && !idMap.get(log.documentId)?.email) {
                    idMap.set(log.documentId, {
                        id: log.documentId,
                        email: log.postImage.email
                    });
                }

                if (log.preImage && log.preImage.email && !idMap.get(log.documentId)?.email) {
                    idMap.set(log.documentId, {
                        id: log.documentId,
                        email: log.preImage.email
                    });
                }
            }
        });

        setDocumentInfo(Array.from(idMap.values()));
    };

    return (
        <div className="bg-white shadow-md rounded-lg overflow-hidden mt-8">
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                <h2 className="text-xl font-semibold text-gray-800">Document History</h2>
            </div>

            {loading ? (
                <div className="text-center py-4">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-blue-600"></div>
                    <p className="mt-2 text-gray-500">Loading document IDs...</p>
                </div>
            ) : documentInfo.length === 0 ? (
                <p className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                    No documents with history found.
                </p>
            ) : (
                <div className="max-h-[300px] overflow-y-auto pr-2">
                    <ul className="space-y-2">
                        {documentInfo.map(doc => (
                            <li key={doc.id}>
                                <Link
                                    href={`/document/${doc.id}`}
                                    className="block p-3 bg-gray-50 hover:bg-blue-50 rounded-lg border border-gray-200 transition-colors"
                                >
                                    <div className="flex flex-row gap-4">
                                        <div>
                                            <span className="text-sm text-gray-600 font-semibold">Document ID:</span>
                                            <span className="text-sm text-gray-600 font-mono ml-1">{doc.id}</span>
                                        </div>
                                        {doc.email && (
                                            <div>
                                                <span className="text-sm text-gray-600 font-semibold">Email:</span>
                                                <span className="text-sm text-gray-600 ml-1">{doc.email}</span>
                                            </div>
                                        )}
                                    </div>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
} 