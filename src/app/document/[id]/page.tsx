'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { X } from 'lucide-react';

interface FieldAuditLog {
  _id?: string;
  documentId: string;
  operationType: 'insert' | 'update' | 'delete';
  changedFields: string;
  oldValue: any;
  newValue: any;
  updatedBy: string;
  timestamp: Date;
}

function DocumentHistoryContent({ params }: { params: { id: string } }) {
  const documentId = params.id;
  const searchParams = useSearchParams();
  const collection = searchParams.get('collection');

  const [logs, setLogs] = useState<FieldAuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocumentLogs();
  }, [documentId, collection]);

  const fetchDocumentLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        collection: collection || '',
        useFieldLogs: 'true',
        documentId: documentId,
        sortBy: 'timestamp',
        sortOrder: 'desc'
      });

      const response = await fetch(`/api/logs?${params}`); // API endpoint to fetch logs
      if (!response.ok) throw new Error('Failed to fetch document history');

      const data = await response.json();
      setLogs(data.data || []);
    } catch (error) {
      console.error('Error fetching document history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (value: any) => {
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground italic">null</span>;
    }
    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }
    if (typeof value === 'object') {
      return <span className="text-muted-foreground italic">null</span>;
    }
    const str = String(value);
    return str.length > 100 ? (
      <span title={str} className="cursor-help">
        {str.substring(0, 100)}...
      </span>
    ) : str;
  };

  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'medium'
    }).format(new Date(date));
  };

  const getDocumentInfo = () => {
    if (logs.length === 0) return null;
    const userInfo = logs.find(log => log.updatedBy !== 'System')?.updatedBy;
    const firstLog = logs[logs.length - 1];
    const lastLog = logs[0];

    return {
      user: userInfo || 'Unknown',
      created: firstLog ? formatDate(firstLog.timestamp) : 'Unknown',
      lastModified: lastLog ? formatDate(lastLog.timestamp) : 'Unknown',
    };
  };

  const docInfo = getDocumentInfo();

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background">
        <div className="bg-card">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <h2 className="text-xl mb-2 font-semibold text-foreground">
                  Document History
                </h2>
                <div className="flex items-center gap-4">
                  <p className="text-muted-foreground">
                    Document ID: <span className="font-mono text-sm">{documentId}</span>
                  </p>
                </div>
              </div>
              <Link href={`/logs?collection=${collection}`}>
                <Button variant="destructive" className="bg-red-500" size="sm">
                  <X className="h-4 w-4 text-white" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 pb-6">
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading document history...</p>
                  </div>
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No history found for this document.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Operation</TableHead>
                      <TableHead>Changed Field</TableHead>
                      <TableHead>Previous Value</TableHead>
                      <TableHead>New Value</TableHead>
                      <TableHead>Updated By</TableHead>
                      <TableHead>Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log, index) => (
                      <TableRow key={log._id || index}>
                        <TableCell>
                          <span className={
                            log.operationType === 'insert' ? 'bg-green-500 text-white rounded-md px-2 font-medium' :
                              log.operationType === 'update' ? 'bg-amber-500 text-white rounded-md px-2 font-medium' : 'bg-red-500 text-white rounded-md px-2 font-medium'
                          }>
                            {log.operationType.toUpperCase()}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium">{log.changedFields}</TableCell>
                        <TableCell className="max-w-xs">
                          <div className="truncate">{formatValue(log.oldValue)}</div>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="truncate">{formatValue(log.newValue)}</div>
                        </TableCell>
                        <TableCell>{log.updatedBy}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(log.timestamp)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

export default function DocumentHistory({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    }>
      <DocumentHistoryContent params={params} />
    </Suspense>
  );
}