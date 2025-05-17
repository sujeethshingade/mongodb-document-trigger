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
  const [refreshing, setRefreshing] = useState(false);
  const [lastOperation, setLastOperation] = useState<string | null>(null);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);

  const isMounted = useRef(true);
  const lastFetchTimeRef = useRef<number>(0);
  const minFetchInterval = 500;

  const shouldFetch = () => {
    const now = Date.now();
    if (now - lastFetchTimeRef.current > minFetchInterval) {
      lastFetchTimeRef.current = now;
      return true;
    }
    return false;
  };

  const fetchAuditLogs = useCallback(async (force = false) => {
    if (!force && !shouldFetch()) return;
    if (!isMounted.current) return;

    try {
      setRefreshing(true);
      const timestamp = Date.now();
      const cacheBuster = Math.random().toString(36).substring(2);
      const url = `/api/audit-logs?t=${timestamp}&cb=${cacheBuster}`;

      const response = await fetch(url, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
        cache: 'no-store',
        next: { revalidate: 0 }
      });

      if (!response.ok) throw new Error('Failed to fetch audit logs');
      const responseData = await response.json();

      if (isMounted.current) {
        setAuditLogs(responseData.data || []);
        setLoading(prev => ({ ...prev, logs: false }));
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      if (isMounted.current) {
        setRefreshing(false);
      }
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    if (!isMounted.current) return;

    try {
      const timestamp = Date.now();
      const cacheBuster = Math.random().toString(36).substring(2);
      const response = await fetch(`/api/users?t=${timestamp}&cb=${cacheBuster}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      });

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
    fetchAuditLogs(true);

    return () => {
      isMounted.current = false;
    };
  }, [fetchUsers, fetchAuditLogs]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (isMounted.current && !refreshing) {
        fetchAuditLogs();
      }
    }, 3000);

    return () => clearInterval(intervalId);
  }, [fetchAuditLogs, refreshing]);

  useEffect(() => {
    if (lastOperation) {
      fetchAuditLogs(true);

      const fetchTimes = [500, 1000, 2000];
      fetchTimes.forEach(delay => {
        setTimeout(() => {
          if (isMounted.current) {
            fetchAuditLogs(true);
          }
        }, delay);
      });

      setLastOperation(null);
    }
  }, [lastOperation, fetchAuditLogs]);

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
      setLastOperation('delete');
    } catch (err) {
      console.error('Error deleting user:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete user');
    }
  };

  const handleUserSaved = async () => {
    await fetchUsers();
    setLastOperation('save');
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
            refreshing={refreshing}
            onRefresh={() => fetchAuditLogs(true)}
          />
        </div>
      </div>
    </div>
  );
}
