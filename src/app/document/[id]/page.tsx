'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FieldAuditLog } from '@/lib/types';
import { ArrowLeft, Clock, User, FileText } from 'lucide-react';

export default function DocumentHistory({ params }: { params: { id: string } }) {
  const documentId = params.id;
  const [logs, setLogs] = useState<FieldAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 100,
    skip: 0,
    hasMore: false
  });

  useEffect(() => {
    fetchDocumentLogs();
  }, [documentId]);

  const fetchDocumentLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        collection: 'users', // Default to users, could be dynamic
        useFieldLogs: 'true',
        documentId: documentId,
        limit: '100',
        sortBy: 'timestamp',
        sortOrder: 'desc'
      });

      const response = await fetch(`/api/audit-logs?${params}`);
      if (!response.ok) throw new Error('Failed to fetch document history');

      const data = await response.json();
      setLogs(data.data || []);
      setPagination(data.pagination || pagination);
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
      return <Badge variant={value ? 'default' : 'secondary'}>{value ? 'true' : 'false'}</Badge>;
    }
    if (typeof value === 'object') {
      return <span className="text-muted-foreground italic">Object</span>;
    }
    const str = String(value);
    return str.length > 100 ? (
      <span title={str} className="cursor-help">
        {str.substring(0, 100)}...
      </span>
    ) : str;
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'medium'
    }).format(d);
  };

  const getOperationBadge = (operation: string) => {
    const variants = {
      insert: 'default',
      update: 'secondary',
      delete: 'destructive'
    } as const;

    return (
      <Badge variant={variants[operation as keyof typeof variants] || 'outline'}>
        {operation.toUpperCase()}
      </Badge>
    );
  };

  const getDocumentInfo = () => {
    if (logs.length === 0) return null;

    const userInfo = logs.find(log => log.updatedBy !== 'system')?.updatedBy;
    const firstLog = logs[logs.length - 1]; // Oldest log (since sorted desc)
    const lastLog = logs[0]; // Newest log

    return {
      user: userInfo || 'Unknown',
      created: firstLog ? formatDate(firstLog.timestamp) : 'Unknown',
      lastModified: lastLog ? formatDate(lastLog.timestamp) : 'Unknown',
      totalChanges: logs.length
    };
  };

  const docInfo = getDocumentInfo();
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b bg-card">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/logs">
                  <Button variant="outline" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Logs
                  </Button>
                </Link>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Document History</h1>
                  <p className="text-muted-foreground">
                    Document ID: <span className="font-mono text-sm">{documentId}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          {/* Document Info Cards */}
          {docInfo && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">User</p>
                      <p className="text-sm text-muted-foreground">{docInfo.user}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Created</p>
                      <p className="text-xs text-muted-foreground">{docInfo.created}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Last Modified</p>
                      <p className="text-xs text-muted-foreground">{docInfo.lastModified}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Total Changes</p>
                      <p className="text-sm text-muted-foreground">{docInfo.totalChanges}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Audit Logs Table */}
          <Card>
            <CardHeader>
              <CardTitle>Change History</CardTitle>
              <CardDescription>
                Detailed field-level changes for this document
              </CardDescription>
            </CardHeader>
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
                      <TableHead>Old Value</TableHead>
                      <TableHead>New Value</TableHead>
                      <TableHead>Updated By</TableHead>
                      <TableHead>Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log, index) => (
                      <TableRow key={log._id || index}>
                        <TableCell>{getOperationBadge(log.operationType)}</TableCell>
                        <TableCell className="font-medium">{log.changedFields}</TableCell>
                        <TableCell className="max-w-xs">
                          <div className="truncate">
                            {formatValue(log.oldValue)}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="truncate">
                            {formatValue(log.newValue)}
                          </div>
                        </TableCell>
                        <TableCell>{log.updatedBy}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(log.timestamp)}
                        </TableCell>
                      </TableRow>
                    ))}                </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
