'use client';

import { useState, useEffect } from 'react';
import { User, Address } from '@/lib/types';

interface UserFormProps {
    onUserSaved: () => void;
    userToEdit?: User | null;
}

export default function UserForm({ onUserSaved, userToEdit = null }: UserFormProps) {
    const initialAddressState: Address = {
        AddressLine1: null,
        AddressLine2: null,
        City: null,
        State: null,
        Country: null,
        ZipCode: null
    };

    const [formData, setFormData] = useState<Partial<User>>({
        name: '',
        email: '',
        role: null,
        Address: initialAddressState
    });

    const [editingUser, setEditingUser] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (userToEdit) {
            setFormData({
                name: userToEdit.name || '',
                email: userToEdit.email || '',
                role: userToEdit.role || null,
                Address: userToEdit.Address || initialAddressState
            });
            setEditingUser(userToEdit._id || null);
        } else {
            resetForm();
        }
    }, [userToEdit]);

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

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || `Failed to ${isEditing ? 'update' : 'create'} user`);
            }

            resetForm();
            onUserSaved();
        } catch (err) {
            console.error('Error saving user:', err);
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setEditingUser(null);
        setFormData({
            name: '',
            email: '',
            role: null,
            Address: initialAddressState
        });
    };

    return (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-xl font-medium text-gray-800">
                    {editingUser ? 'Edit User' : 'Add New User'}
                </h2>                {editingUser && (
                    <div className="px-3 py-1 text-sm bg-secondary text-secondary-foreground rounded-full">
                        Editing User: {formData.email}
                    </div>
                )}
            </div>

            <div className="p-6">
                {error && (
                    <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded">
                        <p className="text-red-700">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="name">
                                Name
                            </label>                            <input
                                className="w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                                id="name"
                                type="text"
                                name="name"
                                value={formData.name || ''}
                                onChange={handleChange}
                                required
                                placeholder="Enter Name"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
                                Email
                            </label>                            <input
                                className="w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                                id="email"
                                type="email"
                                name="email"
                                value={formData.email || ''}
                                onChange={handleChange}
                                required
                                placeholder="Enter Email"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="role">
                                Role
                            </label>                            <select
                                className="w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                                id="role"
                                name="role"
                                value={formData.role || ''}
                                onChange={handleChange}
                            >
                                <option value="">Select a Role</option>
                                <option value="admin">Admin</option>
                                <option value="user">User</option>
                                <option value="guest">Guest</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="Address.AddressLine1">
                                    Address Line 1
                                </label>                                <input
                                    className="w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                                    id="Address.AddressLine1"
                                    type="text"
                                    name="Address.AddressLine1"
                                    value={formData.Address?.AddressLine1 || ''}
                                    onChange={handleChange}
                                    placeholder="Address Line 1"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="Address.AddressLine2">
                                    Address Line 2
                                </label>                                <input
                                    className="w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                                    id="Address.AddressLine2"
                                    type="text"
                                    name="Address.AddressLine2"
                                    value={formData.Address?.AddressLine2 || ''}
                                    onChange={handleChange}
                                    placeholder="Address Line 2"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="Address.City">
                                    City
                                </label>                                <input
                                    className="w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                                    id="Address.City"
                                    type="text"
                                    name="Address.City"
                                    value={formData.Address?.City || ''}
                                    onChange={handleChange}
                                    placeholder="City"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="Address.State">
                                    State
                                </label>                                <input
                                    className="w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                                    id="Address.State"
                                    type="text"
                                    name="Address.State"
                                    value={formData.Address?.State || ''}
                                    onChange={handleChange}
                                    placeholder="State"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="Address.Country">
                                    Country
                                </label>                                <input
                                    className="w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                                    id="Address.Country"
                                    type="text"
                                    name="Address.Country"
                                    value={formData.Address?.Country || ''}
                                    onChange={handleChange}
                                    placeholder="Country"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="Address.ZipCode">
                                    Zip Code
                                </label>                                <input
                                    className="w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                                    id="Address.ZipCode"
                                    type="text"
                                    name="Address.ZipCode"
                                    value={formData.Address?.ZipCode || ''}
                                    onChange={handleChange}
                                    placeholder="Zip Code"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex items-center justify-end space-x-3 border-t border-gray-100">
                        {editingUser && (<button
                            className="px-4 py-2 text-sm text-muted-foreground bg-muted hover:bg-muted/80 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
                            type="button"
                            onClick={resetForm}
                        >
                            Cancel
                        </button>
                        )}
                        <button
                            className={`px-4 py-2 text-sm text-white text-bold bg-blue-600 hover:bg-blue-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                            type="submit"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Saving...' : editingUser ? 'Update User' : 'Add User'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
} 