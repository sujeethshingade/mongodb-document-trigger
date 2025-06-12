'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search } from 'lucide-react';

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

interface DocumentSummary {
    documentId: string;
    lastOperation: string;
    lastUpdated: Date;
}

interface Collection {
    value: string;
    label: string;
    description: string;
}

function DocumentsTable({ documents, selectedCollection }: { documents: DocumentSummary[]; selectedCollection: string; }) {
    const router = useRouter();

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
                    <TableHead>Last Operation</TableHead>
                    <TableHead>Last Updated</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {documents.map((doc) => (
                    <TableRow
                        key={doc.documentId}
                        onClick={() => router.push(`/document/${doc.documentId}?collection=${selectedCollection}`)} // Navigate to detailed document history
                        className="cursor-pointer hover:bg-muted/50"
                    >
                        <TableCell className="font-mono text-sm">{doc.documentId}</TableCell>
                        <TableCell>
                            <Badge className={
                                doc.lastOperation === 'insert' ? 'bg-green-500' :
                                    doc.lastOperation === 'update' ? 'bg-amber-500' : 'bg-red-500'
                            }>
                                {doc.lastOperation.toUpperCase()}
                            </Badge>
                        </TableCell>
                        <TableCell>{new Intl.DateTimeFormat('en-US', {
                            dateStyle: 'short',
                            timeStyle: 'medium'
                        }).format(doc.lastUpdated)}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

function LogsPageContent() {
    const searchParams = useSearchParams();
    const urlCollection = searchParams.get('collection'); // Get collection from URL

    const [collections, setCollections] = useState<Collection[]>([]);
    const [selectedCollection, setSelectedCollection] = useState(urlCollection || '');
    const [collectionsLoading, setCollectionsLoading] = useState(true);
    const [documentSummaries, setDocumentSummaries] = useState<DocumentSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        documentId: '',
        changedFields: '',
        search: ''
    });

    const fetchCollections = useCallback(async () => {
        setCollectionsLoading(true);
        try {
            const response = await fetch('/api/collections'); // API endpoint to fetch collections
            if (!response.ok) throw new Error('Failed to fetch collections');
            const data = await response.json();
            setCollections(data.collections || []);

            if (data.collections && data.collections.length > 0) {
                setSelectedCollection(prev => {
                    if (prev) return prev;
                    if (urlCollection && data.collections.find((c: Collection) => c.value === urlCollection)) {
                        return urlCollection;
                    }
                    return data.collections[0].value; // Default to first collection if none selected
                });
            }
        } catch (error) {
            console.error('Error fetching collections:', error);
        } finally {
            setCollectionsLoading(false);
        }
    }, [urlCollection]);

    useEffect(() => {
        fetchCollections();
    }, [fetchCollections]);

    const fetchDocumentSummaries = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                collection: selectedCollection,
                useFieldLogs: 'true',
            });

            Object.entries(filters).forEach(([key, value]) => {
                if (value && key !== 'search') {
                    params.append(key, value);
                }
            });

            const response = await fetch(`/api/logs?${params}`); // API endpoint to fetch logs
            if (!response.ok) throw new Error('Failed to fetch logs');
            const data = await response.json();
            let allLogs = data.data || [];

            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                allLogs = allLogs.filter((log: FieldAuditLog) =>
                    log.documentId.toLowerCase().includes(searchLower) ||
                    log.changedFields.toLowerCase().includes(searchLower) ||
                    (log.oldValue && String(log.oldValue).toLowerCase().includes(searchLower)) ||
                    (log.newValue && String(log.newValue).toLowerCase().includes(searchLower))
                );
            }

            // Create a map to summarize documents, each document will have its last operation and last updated timestamp
            const documentMap = new Map<string, DocumentSummary>();
            allLogs.forEach((log: FieldAuditLog) => {
                if (!documentMap.has(log.documentId)) {
                    documentMap.set(log.documentId, {
                        documentId: log.documentId,
                        lastOperation: log.operationType,
                        lastUpdated: new Date(log.timestamp),
                    });
                }

                const summary = documentMap.get(log.documentId)!;

                if (new Date(log.timestamp) > summary.lastUpdated) {
                    summary.lastUpdated = new Date(log.timestamp);
                    summary.lastOperation = log.operationType;
                }
            });

            // Convert map to sorted array
            const summaries = Array.from(documentMap.values())
                .sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime());

            setDocumentSummaries(summaries);
        } catch (error) {
            console.error('Error fetching document summaries:', error);
        } finally {
            setLoading(false);
        }
    }, [selectedCollection, filters]);

    useEffect(() => {
        if (selectedCollection) {
            fetchDocumentSummaries();
        }
    }, [selectedCollection, filters, fetchDocumentSummaries]);

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const resetFilters = () => {
        setFilters({ documentId: '', changedFields: '', search: '' });
    };

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-background">
                <div className="container mx-auto px-4 py-6">
                    <Card className="mb-6">
                        <CardHeader>
                            <div className="flex items-center justify-end gap-2">
                                <span className="text-base font-medium">Select Collection:</span>
                                <Select value={selectedCollection} onValueChange={setSelectedCollection} disabled={collectionsLoading}>
                                    <SelectTrigger className="w-[200px]">
                                        <SelectValue placeholder={collectionsLoading ? "Loading..." : "Select collection"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {collections.map((collection) => (
                                            <SelectItem key={collection.value} value={collection.value}>
                                                <span className="font-medium">{collection.label}</span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <CardTitle className="text-lg">Search & Filter Documents</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
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
                                <Input
                                    placeholder="Changed Field"
                                    value={filters.changedFields}
                                    onChange={(e) => handleFilterChange('changedFields', e.target.value)}
                                />
                            </div>
                            <Button
                                variant="outline"
                                onClick={resetFilters}
                                disabled={!Object.values(filters).some(val => val !== '')}
                            >
                                Reset Filters
                            </Button>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-0">
                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="text-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-4"></div>
                                        <p className="text-muted-foreground">Loading documents...</p>
                                    </div>
                                </div>
                            ) : (
                                <DocumentsTable documents={documentSummaries} selectedCollection={selectedCollection} />
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

export default function LogsPage() {
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
            <LogsPageContent />
        </Suspense>
    );
}