'use client';

import { useState, useEffect } from 'react';
import { User, AuditLog } from '@/lib/types';

export default function Main() {
    const [users, setUsers] = useState<User[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState({ users: true, logs: true });

    const [formData, setFormData] = useState<Partial<User>>({
        name: '',
        email: '',
        role: ''
    });

    const [editingUser, setEditingUser] = useState<string | null>(null);
    const [expandedLog, setExpandedLog] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchUsers();
        fetchAuditLogs();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await fetch('/api/users');
            if (!response.ok) throw new Error('Failed to fetch users');
            const data = await response.json();
            setUsers(data);
        } catch (err) {
            console.error('Error fetching users:', err);
            setError('Failed to load users');
        } finally {
            setLoading(prev => ({ ...prev, users: false }));
        }
    };

    const fetchAuditLogs = async () => {
        try {
            const response = await fetch('/api/audit-logs');
            if (!response.ok) throw new Error('Failed to fetch audit logs');
            const data = await response.json();
            setAuditLogs(data);
        } catch (err) {
            console.error('Error fetching audit logs:', err);
        } finally {
            setLoading(prev => ({ ...prev, logs: false }));
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
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

            setFormData({ name: '', email: '', role: '' });
            setEditingUser(null);
            fetchUsers();
            fetchAuditLogs();
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
            role: user.role
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

            fetchUsers();
            fetchAuditLogs();
        } catch (err) {
            console.error('Error deleting user:', err);
            alert(err instanceof Error ? err.message : 'Failed to delete user');
        }
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
                                        value={formData.name}
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
                                        value={formData.email}
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
                                        value={formData.role}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Select a role</option>
                                        <option value="admin">Admin</option>
                                        <option value="user">User</option>
                                        <option value="guest">Guest</option>
                                    </select>
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
                                            setFormData({ name: '', email: '', role: '' });
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
                                                    <span className={`px-2 py-1 text-xs rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                                                        user.role === 'user' ? 'bg-blue-100 text-blue-800' :
                                                            'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {user.role}
                                                    </span>
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
                    <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                        <h2 className="text-xl font-semibold text-gray-800">Audit Logs</h2>
                    </div>

                    <div className="p-6">
                        {loading.logs ? (
                            <div className="text-center py-4">
                                <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-blue-600"></div>
                                <p className="mt-2 text-gray-500">Loading audit logs...</p>
                            </div>
                        ) : auditLogs.length === 0 ? (
                            <p className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                                No audit logs found. Changes to users will appear here.
                            </p>
                        ) : (
                            <div className="space-y-3 overflow-y-auto max-h-96">
                                {auditLogs.map((log) => (
                                    <div
                                        key={log._id}
                                        className="border border-gray-200 rounded-lg overflow-hidden"
                                    >
                                        <div
                                            className="px-4 py-3 cursor-pointer flex justify-between items-center bg-gray-50"
                                            onClick={() => setExpandedLog(expandedLog === log._id ? null : log._id!)}
                                        >
                                            <div className="flex items-center">
                                                <span className={`px-2 py-1 text-xs rounded-full ${getOperationColor(log.operationType)}`}>
                                                    {log.operationType.toUpperCase()}
                                                </span>
                                                <span className="ml-2 text-gray-700">
                                                    Document ID: <code className="bg-gray-100 px-1 py-0.5 rounded">{log.documentId}</code>
                                                </span>
                                                <span className="ml-2 text-gray-500 text-sm">
                                                    {formatDate(log.timestamp)}
                                                </span>
                                            </div>
                                            <button className="text-gray-400 hover:text-gray-600">
                                                {expandedLog === log._id ? '▲' : '▼'}
                                            </button>
                                        </div>

                                        {expandedLog === log._id && (
                                            <div className="p-4 border-t border-gray-200">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div>
                                                        <h3 className="font-semibold text-gray-700 mb-2">Previous State</h3>
                                                        <pre className="bg-white p-3 rounded border border-gray-200 overflow-x-auto text-sm">
                                                            {log.preImage ? JSON.stringify(log.preImage, null, 2) : 'No previous state (new document)'}
                                                        </pre>
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-gray-700 mb-2">Current State</h3>
                                                        <pre className="bg-white p-3 rounded border border-gray-200 overflow-x-auto text-sm">
                                                            {log.postImage ? JSON.stringify(log.postImage, null, 2) : 'No current state (deleted document)'}
                                                        </pre>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}