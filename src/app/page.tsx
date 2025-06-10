'use client';

import { useState, useCallback, useEffect } from 'react';
import Navbar from "@/components/Navbar";
import UserForm from "@/components/UserForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Eye, Users, FileText, BarChart3, Plus, Edit, Trash2 } from 'lucide-react';
import { User } from '@/lib/types';

export default function Home() {
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('create');

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleUserSaved = useCallback(async () => {
    setUserToEdit(null);
    await fetchUsers();
    setActiveTab('manage'); // Switch to manage tab after saving
  }, [fetchUsers]);

  const handleEditUser = useCallback((user: User) => {
    setUserToEdit(user);
    setActiveTab('create'); // Switch to create tab for editing
  }, []);

  const handleDeleteUser = useCallback(async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete user');
      }

      await fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete user');
    }
  }, [fetchUsers]);

  return (
    <div>
      <Navbar />
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <div className="border-b bg-card">
          <div className="container mx-auto px-4 py-12">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-4xl font-bold tracking-tight mb-4">
                MongoDB Document Trigger
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Field-level audit logging system that tracks every change to your MongoDB documents
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/logs">
                  <Button size="lg" className="w-full sm:w-auto">
                    <Eye className="mr-2 h-5 w-5" />
                    View Audit Logs
                  </Button>
                </Link>
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  <FileText className="mr-2 h-5 w-5" />
                  Documentation
                </Button>
              </div>
            </div>
          </div>
        </div>        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content Area */}
            <div className="lg:col-span-2">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="create" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    {userToEdit ? 'Edit User' : 'Create User'}
                  </TabsTrigger>
                  <TabsTrigger value="manage" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Manage Users
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="create" className="mt-6">
                  <UserForm
                    onUserSaved={handleUserSaved}
                    userToEdit={userToEdit}
                  />
                </TabsContent>
                <TabsContent value="manage" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Users Management</CardTitle>
                      <CardDescription>
                        View and manage all users in the system
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loading ? (
                        <div className="text-center py-8">
                          <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-blue-600"></div>
                          <p className="mt-2 text-muted-foreground">Loading users...</p>
                        </div>
                      ) : users.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground">No users found. Create your first user!</p>
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Role</TableHead>
                              <TableHead>Address</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {users.map((user) => (
                              <TableRow key={user._id}>
                                <TableCell className="font-medium">{user.name}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                  {user.role ? (
                                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                                      {user.role}
                                    </Badge>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {user.Address ? (
                                    <span className="text-sm">
                                      {[
                                        user.Address.AddressLine1,
                                        user.Address.City,
                                        user.Address.State
                                      ].filter(Boolean).join(', ') || 'Incomplete'}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleEditUser(user)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Link href={`/logs?documentId=${user._id}`}>
                                      <Button variant="outline" size="sm">
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    </Link>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleDeleteUser(user._id!)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Quick Stats & Actions */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Quick Actions
                  </CardTitle>
                  <CardDescription>
                    Common tasks and navigation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href="/logs" className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <Users className="mr-2 h-4 w-4" />
                      View All Documents
                    </Button>
                  </Link>
                  <Link href="/logs" className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <FileText className="mr-2 h-4 w-4" />
                      Browse Audit Logs
                    </Button>
                  </Link>
                  <Button variant="outline" className="w-full justify-start" disabled>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Analytics (Soon)
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Features</CardTitle>
                  <CardDescription>
                    What makes this audit system special
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium">Field-Level Tracking</p>
                      <p className="text-sm text-muted-foreground">
                        Every field change creates a separate audit entry
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium">Real-time Logging</p>
                      <p className="text-sm text-muted-foreground">
                        MongoDB Atlas triggers capture changes instantly
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium">Multi-Collection Support</p>
                      <p className="text-sm text-muted-foreground">
                        Works with any collection automatically
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium">Advanced Filtering</p>
                      <p className="text-sm text-muted-foreground">
                        Search by document, field, user, or operation
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
