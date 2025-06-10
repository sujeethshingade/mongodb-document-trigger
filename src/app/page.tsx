'use client';

import { useState, useCallback, useEffect } from 'react';
import Navbar from "@/components/Navbar";
import UserForm from "@/components/UserForm";
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Edit, Trash2 } from 'lucide-react';
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
        <div className="container mx-auto px-4 py-10">
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
                  <CardContent>                      {loading ? (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-muted border-t-foreground"></div>
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
                                  className="text-gray-500 hover:text-gray-600"
                                  onClick={() => handleEditUser(user)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className='text-red-500 hover:text-red-600'
                                  onClick={() => handleDeleteUser(user._id!)}
                                >
                                  <Trash2 className="h-4 w-4 " />
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
        </div>
      </div>
    </div>
  );
}
