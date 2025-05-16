'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { User, Address, AuditLog } from '@/lib/types';
import Link from 'next/link';

export default function Main() {
    const [users, setUsers] = useState<User[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState({ users: true, logs: true });
    const [refreshing, setRefreshing] = useState(false);
    const [lastOperation, setLastOperation] = useState<string | null>(null);
    const [editingUser, setEditingUser] = useState<string | null>(null);
    const [expandedLog, setExpandedLog] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState<Partial<User>>({
        name: '',
        email: '',
        role: null,
        Address: {
            AddressLine1: null,
            AddressLine2: null,
            City: null,
            State: null,
            Country: null,
            ZipCode: null
        }
    });

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
            let url = `/api/audit-logs?t=${timestamp}&cb=${cacheBuster}`;

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

            const data = await response.json();

            if (isMounted.current) {
                setAuditLogs(data);
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
            const data = await response.json();

            if (isMounted.current) {
                setUsers(data);
                setLoading(prev => ({ ...prev, users: false }));
            }
        } catch (err) {
            console.error('Error fetching users:', err);
            if (isMounted.current) {
                setError('Failed to load users');
            }
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

            const fetchTimes = [500, 1000, 2000, 3000];

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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        if (name.startsWith('Address.')) {
            const addressField = name.split('.')[1];
            setFormData({
                ...formData,
                Address: {
                    ...formData.Address,
                    [addressField]: value === "" ? null : value,
                }
            });
        } else {
            setFormData({
                ...formData,
                [name]: value === "" ? null : value,
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            const isEditing = !!editingUser;
            const url = isEditing ? `/api/users/${editingUser}` : '/api/users';
            const method = isEditing ? 'PUT' : 'POST';

            console.log('Submitting to:', url, 'with method:', method, 'data:', formData);

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error(`Expected JSON response but got ${contentType}`);
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `Failed to ${isEditing ? 'update' : 'create'} user`);
            }

            setFormData({
                name: '',
                email: '',
                role: null,
                Address: {
                    AddressLine1: null,
                    AddressLine2: null,
                    City: null,
                    State: null,
                    Country: null,
                    ZipCode: null
                }
            });
            setEditingUser(null);
            await fetchUsers();

            setLastOperation(isEditing ? 'update' : 'create');
        } catch (err) {
            console.error('Error saving user:', err);
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditUser = (user: User) => {
        setEditingUser(user._id!);
        setFormData({
            name: user.name,
            email: user.email,
            role: user.role,
            Address: user.Address || {
                AddressLine1: null,
                AddressLine2: null,
                City: null,
                State: null,
                Country: null,
                ZipCode: null
            }
        });
    };

    const handleDeleteUser = async (userId: string) => {
        if (!window.confirm('Are you sure you want to delete this user?')) {
            return;
        }

        try {
            console.log('Deleting user with ID:', userId);

            const response = await fetch(`/api/users/${userId}`, {
                method: 'DELETE',
            });

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error(`Expected JSON response but got ${contentType}`);
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to delete user');
            }

            await fetchUsers();

            setLastOperation('delete');
        } catch (err) {
            console.error('Error deleting user:', err);
            alert(err instanceof Error ? err.message : 'Failed to delete user');
        }
    };

    const manualRefreshAuditLogs = () => {
        fetchAuditLogs(true);
    };

    const formatDate = (dateString: string | Date) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short'
        }).format(date);
    };

    const getOperationColor = (operation: string) => {
        switch (operation) {
            case 'insert': return 'bg-green-100 text-green-800';
            case 'update': return 'bg-blue-100 text-blue-800';
            case 'delete': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getUniqueDocumentIds = () => {
        const uniqueIds = new Set<string>();
        auditLogs.forEach(log => {
            if (log.documentId && log.documentId !== 'unknown') {
                uniqueIds.add(log.documentId);
            }
        });
        return Array.from(uniqueIds);
    };

    return (
        <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">

                <div className="bg-white shadow-md rounded-lg overflow-hidden">
                    <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                        <h2 className="text-xl font-semibold text-gray-800">
                            {editingUser ? 'Edit User' : 'Add New User'}
                        </h2>
                    </div>

                    <div className="p-6">
                        {error && (
                            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="flex flex-wrap md:flex-nowrap gap-4 mb-6">
                                <div className="w-full md:w-1/3">
                                    <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="name">
                                        Name
                                    </label>
                                    <input
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        id="name"
                                        type="text"
                                        name="name"
                                        value={formData.name || ''}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="w-full md:w-1/3">
                                    <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="email">
                                        Email
                                    </label>
                                    <input
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        id="email"
                                        type="email"
                                        name="email"
                                        value={formData.email || ''}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="w-full md:w-1/3">
                                    <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="role">
                                        Role
                                    </label>
                                    <select
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        id="role"
                                        name="role"
                                        value={formData.role || ''}
                                        onChange={handleChange}
                                    >
                                        <option value="">Select a role</option>
                                        <option value="admin">Admin</option>
                                        <option value="user">User</option>
                                        <option value="guest">Guest</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mb-6">
                                <h3 className="text-gray-700 text-sm font-semibold mb-2">Address</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-gray-700 text-sm mb-2" htmlFor="Address.AddressLine1">
                                            Address Line 1
                                        </label>
                                        <input
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            id="Address.AddressLine1"
                                            type="text"
                                            name="Address.AddressLine1"
                                            value={formData.Address?.AddressLine1 || ''}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-gray-700 text-sm mb-2" htmlFor="Address.AddressLine2">
                                            Address Line 2
                                        </label>
                                        <input
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            id="Address.AddressLine2"
                                            type="text"
                                            name="Address.AddressLine2"
                                            value={formData.Address?.AddressLine2 || ''}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-gray-700 text-sm mb-2" htmlFor="Address.City">
                                            City
                                        </label>
                                        <input
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            id="Address.City"
                                            type="text"
                                            name="Address.City"
                                            value={formData.Address?.City || ''}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-gray-700 text-sm mb-2" htmlFor="Address.State">
                                            State
                                        </label>
                                        <input
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            id="Address.State"
                                            type="text"
                                            name="Address.State"
                                            value={formData.Address?.State || ''}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-gray-700 text-sm mb-2" htmlFor="Address.Country">
                                            Country
                                        </label>
                                        <input
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            id="Address.Country"
                                            type="text"
                                            name="Address.Country"
                                            value={formData.Address?.Country || ''}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <label className="block text-gray-700 text-sm mb-2" htmlFor="Address.ZipCode">
                                        Zip Code
                                    </label>
                                    <input
                                        className="shadow appearance-none border rounded w-full md:w-1/3 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        id="Address.ZipCode"
                                        type="text"
                                        name="Address.ZipCode"
                                        value={formData.Address?.ZipCode || ''}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <button
                                    className={`bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                                        }`}
                                    type="submit"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Saving...' : editingUser ? 'Update User' : 'Add User'}
                                </button>

                                {editingUser && (
                                    <button
                                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
                                        type="button"
                                        onClick={() => {
                                            setEditingUser(null);
                                            setFormData({
                                                name: '',
                                                email: '',
                                                role: null,
                                                Address: {
                                                    AddressLine1: null,
                                                    AddressLine2: null,
                                                    City: null,
                                                    State: null,
                                                    Country: null,
                                                    ZipCode: null
                                                }
                                            });
                                        }}
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>

                <div className="bg-white shadow-md rounded-lg overflow-hidden mt-8">
                    <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                        <h2 className="text-xl font-semibold text-gray-800">Users</h2>
                    </div>

                    <div className="p-6">
                        {loading.users ? (
                            <div className="text-center py-4">
                                <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-blue-600"></div>
                                <p className="mt-2 text-gray-500">Loading users...</p>
                            </div>
                        ) : users.length === 0 ? (
                            <p className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                                No users found. Add a new user to get started.
                            </p>
                        ) : (
                            <div className="overflow-y-auto max-h-96">
                                <table className="min-w-full leading-normal">
                                    <thead>
                                        <tr>
                                            <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider sticky top-0">
                                                Name
                                            </th>
                                            <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider sticky top-0">
                                                Email
                                            </th>
                                            <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider sticky top-0">
                                                Role
                                            </th>
                                            <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider sticky top-0">
                                                Address
                                            </th>
                                            <th className="px-6 py-3 border-b-2 border-gray-200 bg-gray-50 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider sticky top-0">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map((user) => (
                                            <tr key={user._id}>
                                                <td className="px-6 py-4 border-b border-gray-200">
                                                    <div className="flex items-center">
                                                        <div className="ml-3">
                                                            <p className="text-gray-900 whitespace-no-wrap">{user.name}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 border-b border-gray-200">
                                                    <p className="text-gray-900 whitespace-no-wrap">{user.email}</p>
                                                </td>
                                                <td className="px-6 py-4 border-b border-gray-200">
                                                    {user.role ? (
                                                        <span className={`px-2 py-1 text-xs rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                                                            user.role === 'user' ? 'bg-blue-100 text-blue-800' :
                                                                'bg-gray-100 text-gray-800'
                                                            }`}>
                                                            {user.role}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-500 text-sm">Not specified</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 border-b border-gray-200">
                                                    <p className="text-gray-900 text-sm">
                                                        {user.Address?.AddressLine1 ?
                                                            `${user.Address.AddressLine1}${user.Address.City ? `, ${user.Address.City}` : ''}${user.Address.State ? `, ${user.Address.State}` : ''}`
                                                            : 'Not provided'}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-4 border-b border-gray-200 text-right">
                                                    <button
                                                        onClick={() => handleEditUser(user)}
                                                        className="text-blue-600 hover:text-blue-900 mr-4"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteUser(user._id!)}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white shadow-md rounded-lg overflow-hidden mt-8">
                    <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 flex justify-between items-center">
                        <h2 className="text-xl font-semibold text-gray-800">Document History</h2>
                        <button
                            onClick={manualRefreshAuditLogs}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center"
                            disabled={refreshing}
                        >
                            {refreshing ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Refreshing...
                                </>
                            ) : (
                                'Refresh Documents'
                            )}
                        </button>
                    </div>

                    <div className="p-6">
                        {loading.logs ? (
                            <div className="text-center py-4">
                                <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-blue-600"></div>
                                <p className="mt-2 text-gray-500">Loading document IDs...</p>
                            </div>
                        ) : getUniqueDocumentIds().length === 0 ? (
                            <p className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                                No documents with history found.
                            </p>
                        ) : (
                            <div className="border rounded-lg overflow-hidden">
                                <ul className="divide-y divide-gray-200">
                                    {getUniqueDocumentIds().map(id => (
                                        <li
                                            key={id}
                                            className="p-4 hover:bg-blue-50 cursor-pointer transition-colors"
                                        >
                                            <Link href={`/document/${id}`} className="flex items-center">
                                                <div className="mr-3">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-800">Document ID:</p>
                                                    <p className="text-sm text-gray-600 font-mono">{id}</p>
                                                </div>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}