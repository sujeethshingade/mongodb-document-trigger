'use client';

import { useState, useCallback, useEffect } from 'react';
import Navbar from "@/components/Navbar";
import UserForm from "@/components/UserForm";
import UserList from "@/components/UserList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Plus } from 'lucide-react';
import { User } from '@/lib/types';

export default function Home() {
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('create');

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/collections/users');
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
    setActiveTab('manage');
  }, [fetchUsers]);

  const handleEditUser = useCallback((user: User) => {
    setUserToEdit(user);
    setActiveTab('create');
  }, []);

  return (
    <div>
      <Navbar />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-10">
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
              <UserList
                users={users}
                loading={loading}
                onEditUser={handleEditUser}
                onRefresh={fetchUsers}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
