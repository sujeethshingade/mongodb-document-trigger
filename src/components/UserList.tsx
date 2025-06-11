'use client';

import { useState, useCallback } from 'react';
import { User } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Loader2 } from 'lucide-react';

interface UserListProps {
    users: User[];
    loading: boolean;
    onEditUser: (user: User) => void;
    onRefresh: () => void;
}

export default function UserList({ users, loading, onEditUser, onRefresh }: UserListProps) {
    const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

    const handleDeleteUser = useCallback(async (userId: string) => {
        if (!window.confirm('Are you sure you want to delete this user?')) {
            return;
        }

        setDeletingUserId(userId);

        try {
            const response = await fetch(`/api/collections/users/${userId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to delete user');
            }

            await onRefresh();
        } catch (error) {
            console.error('Error deleting user:', error);
            alert(error instanceof Error ? error.message : 'Failed to delete user');
        } finally {
            setDeletingUserId(null);
        }
    }, [onRefresh]);

    return (
        <Card>
            <CardContent className="p-0">
                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                        <p className="mt-4 text-muted-foreground">Loading users...</p>
                    </div>
                ) : users.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="mx-auto w-24 h-24 text-muted-foreground/50 mb-4">
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                className="w-full h-full"
                            >
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-muted-foreground mb-2">No users found</h3>
                        <p className="text-sm text-muted-foreground">Create your first user to get started!</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-b">
                                    <TableHead className="font-semibold">Name</TableHead>
                                    <TableHead className="font-semibold">Email</TableHead>
                                    <TableHead className="font-semibold">Role</TableHead>
                                    <TableHead className="font-semibold">Address</TableHead>
                                    <TableHead className="text-right font-semibold">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user._id} className="hover:bg-muted/50">
                                        <TableCell className="font-medium">
                                            {user.name}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {user.email}
                                        </TableCell>
                                        <TableCell>
                                            {user.role ? (
                                                <Badge
                                                    variant={user.role === 'admin' ? 'default' : 'secondary'}
                                                    className="capitalize"
                                                >
                                                    {user.role}
                                                </Badge>
                                            ) : (
                                                <span className="text-muted-foreground text-sm">No role</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {user.Address && (user.Address.AddressLine1 || user.Address.City || user.Address.State) ? (
                                                <div className="text-sm">
                                                    <div className="max-w-xs truncate">
                                                        {[
                                                            user.Address.AddressLine1,
                                                            user.Address.City,
                                                            user.Address.State
                                                        ].filter(Boolean).join(', ')}
                                                    </div>
                                                    {user.Address.Country && (
                                                        <div className="text-muted-foreground text-xs">
                                                            {user.Address.Country}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground text-sm">No address</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 w-8 p-0"
                                                    onClick={() => onEditUser(user)}
                                                    disabled={!!deletingUserId}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                    <span className="sr-only">Edit user</span>
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                                    onClick={() => handleDeleteUser(user._id!)}
                                                    disabled={!!deletingUserId}
                                                >
                                                    {deletingUserId === user._id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="h-4 w-4" />
                                                    )}
                                                    <span className="sr-only">Delete user</span>
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
