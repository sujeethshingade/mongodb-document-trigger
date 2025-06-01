'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from "@/components/Navbar";
import UserForm from "@/components/UserForm";
import UsersList from "@/components/UsersList";
import DocumentList from "@/components/DocumentList";
import { User, AuditLog } from '@/lib/types';

export default function Home() {
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState({ users: true, logs: true });
  const [userToEdit, setUserToEdit] = useState<User | null>(null);

  const isMounted = useRef(true);

  const fetchAuditLogs = useCallback(async () => {
    if (!isMounted.current) return;

    try {
      const response = await fetch('/api/audit-logs');
      if (!response.ok) throw new Error('Failed to fetch audit logs');
      const responseData = await response.json();

      if (isMounted.current) {
        setAuditLogs(responseData.data || []);
        setLoading(prev => ({ ...prev, logs: false }));
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    if (!isMounted.current) return;

    try {
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      const responseData = await response.json();

      if (isMounted.current) {
        setUsers(responseData.data || []);
        setLoading(prev => ({ ...prev, users: false }));
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    fetchUsers();
    fetchAuditLogs();

    return () => {
      isMounted.current = false;
    };
  }, [fetchUsers, fetchAuditLogs]);

  const handleDeleteUser = async (userId: string) => {
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
      await fetchAuditLogs();
    } catch (err) {
      console.error('Error deleting user:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete user');
    }
  };

  const handleUserSaved = async () => {
    await fetchUsers();
    await fetchAuditLogs();
    setUserToEdit(null);
  };

  const handleEditUser = (user: User) => {
    setUserToEdit(user);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div>
      <Navbar />
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <UserForm onUserSaved={handleUserSaved} userToEdit={userToEdit} />
          <UsersList
            users={users}
            loading={loading.users}
            onEditUser={handleEditUser}
            onDeleteUser={handleDeleteUser}
          />
          <DocumentList
            auditLogs={auditLogs}
            loading={loading.logs}
          />
        </div>
      </div>
    </div>
  );
}
