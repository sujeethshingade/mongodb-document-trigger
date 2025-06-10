'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FieldAuditLog } from '@/lib/types';
import Link from 'next/link';
import { Search, Filter, Eye, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';

interface LogsPageProps { }

interface DocumentSummary {
    documentId: string;
    email?: string;
    lastOperation: string;
    lastUpdated: Date;
    totalChanges: number;
}

interface PaginationInfo {
    total: number;
    limit: number;
    skip: number;
    hasMore: boolean;
}

interface Collection {
    value: string;
    label: string;
    description: string;
}

// Documents Table Component
function DocumentsTable({
    documents,
    selectedCollection
}: {
    documents: DocumentSummary[];
    selectedCollection: string;
}) {
    if (documents.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">No documents found for {selectedCollection} collection.</p>
            </div>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Document ID</TableHead>
                    <TableHead>User/Email</TableHead>
                    <TableHead>Last Operation</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead>Total Changes</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {documents.map((doc) => (
                    <TableRow key={doc.documentId}>
                        <TableCell className="font-mono text-sm">{doc.documentId}</TableCell>
                        <TableCell>{doc.email || <span className="text-muted-foreground">Unknown</span>}</TableCell>
                        <TableCell>
                            <Badge variant={
                                doc.lastOperation === 'insert' ? 'default' :
                                    doc.lastOperation === 'update' ? 'secondary' : 'destructive'
                            }>
                                {doc.lastOperation.toUpperCase()}
                            </Badge>
                        </TableCell>
                        <TableCell>{new Intl.DateTimeFormat('en-US', {
                            dateStyle: 'short',
                            timeStyle: 'medium'
                        }).format(doc.lastUpdated)}</TableCell>
                        <TableCell>
                            <Badge variant="outline">{doc.totalChanges}</Badge>
                        </TableCell>
                        <TableCell>
                            <Link href={`/document/${doc.documentId}`}>
                                <Button variant="ghost" size="sm">
                                    <Eye className="h-4 w-4" />
                                </Button>
                            </Link>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

// Logs Table Component
function LogsTable({
    logs,
    onSort,
    sortBy,
    sortOrder,
    getSortIcon,
    formatValue,
    formatDate,
    getOperationBadge,
    pagination,
    onPageChange
}: {
    logs: FieldAuditLog[];
    onSort: (field: string) => void;
    sortBy: string;
    sortOrder: string;
    getSortIcon: (field: string) => React.ReactNode;
    formatValue: (value: any) => React.ReactNode;
    formatDate: (date: Date | string) => string;
    getOperationBadge: (operation: string) => React.ReactNode;
    pagination: PaginationInfo;
    onPageChange: (skip: number) => void;
}) {
    if (logs.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">No logs found matching your criteria.</p>
            </div>
        );
    }

    return (
        <>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => onSort('documentId')}
                        >
                            <div className="flex items-center gap-2">
                                Document ID
                                {getSortIcon('documentId')}
                            </div>
                        </TableHead>
                        <TableHead
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => onSort('operationType')}
                        >
                            <div className="flex items-center gap-2">
                                Operation
                                {getSortIcon('operationType')}
                            </div>
                        </TableHead>
                        <TableHead
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => onSort('changedFields')}
                        >
                            <div className="flex items-center gap-2">
                                Changed Field
                                {getSortIcon('changedFields')}
                            </div>
                        </TableHead>
                        <TableHead>Old Value</TableHead>
                        <TableHead>New Value</TableHead>
                        <TableHead
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => onSort('updatedBy')}
                        >
                            <div className="flex items-center gap-2">
                                Updated By
                                {getSortIcon('updatedBy')}
                            </div>
                        </TableHead>
                        <TableHead
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => onSort('timestamp')}
                        >
                            <div className="flex items-center gap-2">
                                Timestamp
                                {getSortIcon('timestamp')}
                            </div>
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {logs.map((log, index) => (
                        <TableRow key={log._id || index}>
                            <TableCell className="font-mono text-sm">{log.documentId}</TableCell>
                            <TableCell>{getOperationBadge(log.operationType)}</TableCell>
                            <TableCell className="font-medium">{log.changedFields}</TableCell>
                            <TableCell className="max-w-xs">{formatValue(log.oldValue)}</TableCell>
                            <TableCell className="max-w-xs">{formatValue(log.newValue)}</TableCell>
                            <TableCell>{log.updatedBy}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                                {formatDate(log.timestamp)}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-4 border-t">
                <div className="text-sm text-muted-foreground">
                    Showing {pagination.skip + 1} to {Math.min(pagination.skip + pagination.limit, pagination.total)} of {pagination.total} results
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(Math.max(0, pagination.skip - pagination.limit))}
                        disabled={pagination.skip === 0}
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(pagination.skip + pagination.limit)}
                        disabled={!pagination.hasMore}
                    >
                        Next
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </>
    );
}

export default function LogsPage({ }: LogsPageProps) {
    const [collections, setCollections] = useState<Collection[]>([]);
    const [selectedCollection, setSelectedCollection] = useState('');
    const [collectionsLoading, setCollectionsLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'documents' | 'logs'>('documents');
    const [logs, setLogs] = useState<FieldAuditLog[]>([]);
    const [documentSummaries, setDocumentSummaries] = useState<DocumentSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState<PaginationInfo>({
        total: 0,
        limit: 50,
        skip: 0,
        hasMore: false
    });

    // Filters
    const [filters, setFilters] = useState({
        documentId: '',
        operationType: '',
        changedFields: '',
        updatedBy: '',
        search: ''
    });
    const [sortBy, setSortBy] = useState('timestamp');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // Fetch available collections
    const fetchCollections = useCallback(async () => {
        setCollectionsLoading(true);
        try {
            const response = await fetch('/api/collections');
            if (!response.ok) throw new Error('Failed to fetch collections');

            const data = await response.json();
            setCollections(data.collections || []);

            // Set the first collection as default if none is selected
            if (data.collections && data.collections.length > 0 && !selectedCollection) {
                setSelectedCollection(data.collections[0].value);
            }
        } catch (error) {
            console.error('Error fetching collections:', error);
            // Fallback to default collections if API fails
            const fallbackCollections = [
                { value: 'users', label: 'Users', description: 'User account data' }
            ];
            setCollections(fallbackCollections);
            if (!selectedCollection) {
                setSelectedCollection('users');
            }
        } finally {
            setCollectionsLoading(false);
        }
    }, [selectedCollection]);

    useEffect(() => {
        fetchCollections();
    }, [fetchCollections]);

    // Fetch document summaries for the documents view
    const fetchDocumentSummaries = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                collection: selectedCollection,
                useFieldLogs: 'true',
                limit: '1000' // Get more to group by document
            });

            const response = await fetch(`/api/audit-logs?${params}`);
            if (!response.ok) throw new Error('Failed to fetch logs');

            const data = await response.json();
            const allLogs = data.data || [];

            // Group logs by document ID
            const documentMap = new Map<string, DocumentSummary>();

            allLogs.forEach((log: FieldAuditLog) => {
                if (!documentMap.has(log.documentId)) {
                    documentMap.set(log.documentId, {
                        documentId: log.documentId,
                        email: log.updatedBy !== 'system' ? log.updatedBy : undefined,
                        lastOperation: log.operationType,
                        lastUpdated: new Date(log.timestamp),
                        totalChanges: 0
                    });
                }

                const summary = documentMap.get(log.documentId)!;
                summary.totalChanges++;

                if (new Date(log.timestamp) > summary.lastUpdated) {
                    summary.lastUpdated = new Date(log.timestamp);
                    summary.lastOperation = log.operationType;
                }
            });

            const summaries = Array.from(documentMap.values())
                .sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime());

            setDocumentSummaries(summaries);
        } catch (error) {
            console.error('Error fetching document summaries:', error);
        } finally {
            setLoading(false);
        }
    }, [selectedCollection]);

    // Fetch individual logs for the logs view
    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                collection: selectedCollection,
                useFieldLogs: 'true',
                limit: pagination.limit.toString(),
                skip: pagination.skip.toString(),
                sortBy,
                sortOrder
            });

            // Add filters
            Object.entries(filters).forEach(([key, value]) => {
                if (value && key !== 'search') {
                    params.append(key, value);
                }
            });

            const response = await fetch(`/api/audit-logs?${params}`);
            if (!response.ok) throw new Error('Failed to fetch logs');

            const data = await response.json();
            let filteredLogs = data.data || [];

            // Apply search filter on client side for better UX
            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                filteredLogs = filteredLogs.filter((log: FieldAuditLog) =>
                    log.documentId.toLowerCase().includes(searchLower) ||
                    log.changedFields.toLowerCase().includes(searchLower) ||
                    log.updatedBy.toLowerCase().includes(searchLower) ||
                    (log.oldValue && String(log.oldValue).toLowerCase().includes(searchLower)) ||
                    (log.newValue && String(log.newValue).toLowerCase().includes(searchLower))
                );
            }

            setLogs(filteredLogs);
            setPagination(data.pagination || pagination);
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setLoading(false);
        }
    }, [selectedCollection, pagination.limit, pagination.skip, filters, sortBy, sortOrder]);

    useEffect(() => {
        if (selectedCollection && (viewMode === 'documents')) {
            fetchDocumentSummaries();
        } else if (selectedCollection && (viewMode === 'logs')) {
            fetchLogs();
        }
    }, [viewMode, selectedCollection, fetchDocumentSummaries, fetchLogs]);

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, skip: 0 }));
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
            return <span className="text-muted-foreground italic">null</span>;
        }
        if (typeof value === 'boolean') {
            return <Badge variant={value ? 'default' : 'secondary'}>{value ? 'true' : 'false'}</Badge>;
        }
        if (typeof value === 'object') {
            return <span className="text-muted-foreground italic">Object</span>;
        }
        const str = String(value);
        return str.length > 50 ? (
            <span title={str}>{str.substring(0, 50)}...</span>
        ) : str;
    };

    const formatDate = (date: Date | string) => {
        const d = new Date(date);
        return new Intl.DateTimeFormat('en-US', {
            dateStyle: 'short',
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

    const getSortIcon = (field: string) => {
        if (sortBy !== field) {
            return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />;
        }
        return (
            <ArrowUpDown className={`h-4 w-4 ${sortOrder === 'asc' ? 'rotate-180' : ''} text-primary`} />
        );
    };

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-background">
                {/* Header */}
                <div className="border-b bg-card">
                    <div className="container mx-auto px-4 py-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
                                <p className="text-muted-foreground">
                                    Track all document changes across your collections
                                </p>
                            </div>
                            <div className="flex items-center gap-4">
                                <Select
                                    value={selectedCollection}
                                    onValueChange={setSelectedCollection}
                                    disabled={collectionsLoading}
                                >
                                    <SelectTrigger className="w-[200px]">
                                        <SelectValue placeholder={collectionsLoading ? "Loading..." : "Select collection"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {collections.length === 0 && !collectionsLoading ? (
                                            <SelectItem value="no-collections" disabled>
                                                No collections found
                                            </SelectItem>
                                        ) : (
                                            collections.map((collection) => (
                                                <SelectItem key={collection.value} value={collection.value}>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{collection.label}</span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {collection.description}
                                                        </span>
                                                    </div>
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>

                                <div className="flex bg-muted rounded-lg p-1">
                                    <Button
                                        variant={viewMode === 'documents' ? 'default' : 'ghost'}
                                        size="sm"
                                        onClick={() => setViewMode('documents')}
                                        className="rounded-md"
                                    >
                                        Documents
                                    </Button>
                                    <Button
                                        variant={viewMode === 'logs' ? 'default' : 'ghost'}
                                        size="sm"
                                        onClick={() => setViewMode('logs')}
                                        className="rounded-md"
                                    >
                                        All Logs
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="container mx-auto px-4 py-6">
                    {/* Filters */}
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Filter className="h-5 w-5" />
                                Filters & Search
                            </CardTitle>
                            <CardDescription>
                                Filter and search through {selectedCollection} logs
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search all fields..."
                                        value={filters.search}
                                        onChange={(e) => handleFilterChange('search', e.target.value)}
                                        className="pl-9"
                                    />
                                </div>

                                <Input
                                    placeholder="Document ID"
                                    value={filters.documentId}
                                    onChange={(e) => handleFilterChange('documentId', e.target.value)}
                                />
                                <Select
                                    value={filters.operationType || "all"}
                                    onValueChange={(value) => handleFilterChange('operationType', value === "all" ? "" : value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Operation Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Operations</SelectItem>
                                        <SelectItem value="insert">Insert</SelectItem>
                                        <SelectItem value="update">Update</SelectItem>
                                        <SelectItem value="delete">Delete</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Input
                                    placeholder="Changed Field"
                                    value={filters.changedFields}
                                    onChange={(e) => handleFilterChange('changedFields', e.target.value)}
                                />

                                <Input
                                    placeholder="Updated By"
                                    value={filters.updatedBy}
                                    onChange={(e) => handleFilterChange('updatedBy', e.target.value)}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Content */}
                    <Card>
                        <CardContent className="p-0">
                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="text-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-4"></div>
                                        <p className="text-muted-foreground">Loading {viewMode}...</p>
                                    </div>
                                </div>
                            ) : viewMode === 'documents' ? (
                                <DocumentsTable
                                    documents={documentSummaries}
                                    selectedCollection={selectedCollection}
                                />
                            ) : (
                                <LogsTable
                                    logs={logs}
                                    onSort={handleSort}
                                    sortBy={sortBy}
                                    sortOrder={sortOrder}
                                    getSortIcon={getSortIcon}
                                    formatValue={formatValue}
                                    formatDate={formatDate}
                                    getOperationBadge={getOperationBadge}
                                    pagination={pagination}
                                    onPageChange={handlePageChange}
                                />
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}
