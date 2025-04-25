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

    // Fetch data on component mount
    useEffect(() => {
        fetchUsers();
        fetchAuditLogs();
    }, []);

    // Fetch users from API
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

    // Fetch audit logs from API
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

    // Handle form input changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    // Handle form submission for creating or updating users
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            const isEditing = !!editingUser;
            const url = isEditing ? `/api/users/${editingUser}` : '/api/users';
            const method = isEditing ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error(`Failed to ${isEditing ? 'update' : 'create'} user`);
            }

            // Refresh data
            fetchUsers();
            fetchAuditLogs();

            // Reset form
            setFormData({ name: '', email: '', role: '' });
            setEditingUser(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle user deletion
    const handleDeleteUser = async (userId: string) => {
        if (!window.confirm('Are you sure you want to delete this user?')) {
            return;
        }

        try {
            const response = await fetch(`/api/users/${userId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete user');
            }

            // Refresh data
            fetchUsers();
            fetchAuditLogs();
        } catch (err) {
            console.error('Error deleting user:', err);
            alert('Failed to delete user');
        }
    };

    // Handle user edit
    const handleEditUser = (user: User) => {
        setFormData({
            name: user.name,
            email: user.email,
            role: user.role,
        });
        setEditingUser(user._id!);
    };

    // Format date for display
    const formatDate = (dateString: string | Date) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short',
        }).format(date);
    };

    // Get color for operation type
    const getOperationColor = (operation: string) => {
        switch (operation) {
            case 'insert': return 'bg-green-100 text-green-800';
            case 'update': return 'bg-blue-100 text-blue-800';
            case 'delete': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="container mx-auto py-6 px-4 max-w-6xl">
            <div className="space-y-10">
                {/* User Management Section */}
                <div className="bg-white shadow-md rounded-lg overflow-hidden">
                    <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                        <h2 className="text-xl font-semibold text-gray-800">User Management</h2>
                    </div>

                    <div className="p-6">
                        {/* User Form */}
                        <form onSubmit={handleSubmit} className="mb-8 bg-gray-50 p-5 rounded-lg border border-gray-200">
                            <h3 className="text-lg font-medium mb-4 text-gray-700">
                                {editingUser ? 'Edit User' : 'Create New User'}
                            </h3>

                            {error && (
                                <div className="p-3 mb-4 bg-red-100 text-red-700 rounded-md text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                        Name
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                                        Role
                                    </label>
                                    <select
                                        id="role"
                                        name="role"
                                        value={formData.role}
                                        onChange={handleChange}
                                        required
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select role</option>
                                        <option value="admin">Admin</option>
                                        <option value="user">User</option>
                                        <option value="editor">Editor</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                >
                                    {isSubmitting ? 'Saving...' : editingUser ? 'Update' : 'Create'}
                                </button>

                                {editingUser && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditingUser(null);
                                            setFormData({ name: '', email: '', role: '' });
                                        }}
                                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </form>

                        {/* Users List */}
                        <div>
                            <h3 className="text-lg font-medium mb-4 text-gray-700">Users</h3>

                            {loading.users ? (
                                <div className="text-center py-4">
                                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-blue-600"></div>
                                    <p className="mt-2 text-gray-500">Loading users...</p>
                                </div>
                            ) : users.length === 0 ? (
                                <p className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                                    No users found. Create your first user above.
                                </p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {users.map((user) => (
                                                <tr key={user._id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">{user.name}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                                            {user.role}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
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
                </div>

                {/* Audit Logs Section */}
                <div className="bg-white shadow-md rounded-lg overflow-hidden">
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
                            <div className="space-y-3">
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
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getOperationColor(log.operationType)}`}>
                                                    {log.operationType.toUpperCase()}
                                                </span>
                                                <span className="ml-3 text-gray-700 text-sm font-medium">
                                                    ID: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">{log.documentId}</code>
                                                </span>
                                                <span className="ml-3 text-gray-500 text-sm">
                                                    {formatDate(log.timestamp)}
                                                </span>
                                            </div>
                                            <button className="text-gray-400 hover:text-gray-600">
                                                {expandedLog === log._id ? '▲' : '▼'}
                                            </button>
                                        </div>

                                        {expandedLog === log._id && (
                                            <div className="p-4 border-t border-gray-200">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <h4 className="font-medium text-gray-700 mb-2">Previous State</h4>
                                                        <pre className="bg-gray-50 p-3 rounded border border-gray-200 overflow-x-auto text-xs h-48 overflow-y-auto">
                                                            {log.preImage ? JSON.stringify(log.preImage, null, 2) : 'No previous state (new document)'}
                                                        </pre>
                                                    </div>

                                                    <div>
                                                        <h4 className="font-medium text-gray-700 mb-2">Current State</h4>
                                                        <pre className="bg-gray-50 p-3 rounded border border-gray-200 overflow-x-auto text-xs h-48 overflow-y-auto">
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