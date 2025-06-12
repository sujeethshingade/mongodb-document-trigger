'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, X } from 'lucide-react';

interface User {
  _id?: string;
  name: string;
  email: string;
  role?: string | null;
  Address?: Address | null;
}

interface Address {
  AddressLine1?: string | null;
  AddressLine2?: string | null;
  City?: string | null;
  State?: string | null;
  Country?: string | null;
  ZipCode?: string | null;
}

interface UserFormProps {
    onUserSaved: () => void;
    userToEdit?: User | null;
}

export default function UserForm({ onUserSaved, userToEdit = null }: UserFormProps) {
    const [formData, setFormData] = useState<Partial<User>>({
        name: '', email: '', role: null, Address: {}
    });
    const [editingUser, setEditingUser] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const resetForm = () => {
        setFormData({ name: '', email: '', role: null, Address: {} });
        setEditingUser(null);
        setError('');
    }; useEffect(() => {
        if (userToEdit) {
            setFormData({
                name: userToEdit.name || '',
                email: userToEdit.email || '',
                role: userToEdit.role || null,
                Address: userToEdit.Address || {}
            });
            setEditingUser(userToEdit._id || null);
        } else {
            resetForm();
        }
    }, [userToEdit]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name.startsWith('Address.')) {
            const field = name.split('.')[1];
            setFormData(prev => ({ ...prev, Address: { ...prev.Address, [field]: value || null } }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value || null }));
        }
    }; const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            const isEditing = !!editingUser;
            const cleanData = Object.fromEntries(
                Object.entries(formData).filter(([_, v]) => v !== null && v !== undefined && v !== '')
            );

            const response = await fetch(
                isEditing ? `/api/collections/users/${editingUser}` : '/api/collections/users', // API endpoint for user creation or update
                {
                    method: isEditing ? 'PUT' : 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(cleanData)
                }
            );

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

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
                <CardTitle className="text-xl font-semibold">
                    {editingUser ? 'Edit User' : 'Add New User'}
                </CardTitle>
                {editingUser && (
                    <Badge variant="secondary" className="flex items-center gap-2">
                        <span>Editing:</span>
                        <span className="font-medium">{formData.email}</span>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 hover:bg-transparent"
                            onClick={resetForm}
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    </Badge>
                )}
            </CardHeader>

            <CardContent>
                {error && (
                    <Alert variant="destructive" className="mb-6">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name *</Label>
                            <Input
                                id="name"
                                name="name"
                                type="text"
                                value={formData.name || ''}
                                onChange={handleChange}
                                placeholder="Enter full name"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email *</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email || ''}
                                onChange={handleChange}
                                placeholder="Enter email address"
                                required
                            />
                        </div>                        <div className="space-y-2">
                            <Label htmlFor="role">Role</Label>
                            <Input
                                id="role"
                                name="role"
                                type="text"
                                value={formData.role || ''}
                                onChange={handleChange}
                                placeholder="Enter your role"
                            />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="Address.AddressLine1">Address Line 1</Label>
                                <Input
                                    id="Address.AddressLine1"
                                    name="Address.AddressLine1"
                                    type="text"
                                    value={formData.Address?.AddressLine1 || ''}
                                    onChange={handleChange}
                                    placeholder="Street address"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="Address.AddressLine2">Address Line 2</Label>
                                <Input
                                    id="Address.AddressLine2"
                                    name="Address.AddressLine2"
                                    type="text"
                                    value={formData.Address?.AddressLine2 || ''}
                                    onChange={handleChange}
                                    placeholder="Apartment, suite, etc."
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="Address.City">City</Label>
                                <Input
                                    id="Address.City"
                                    name="Address.City"
                                    type="text"
                                    value={formData.Address?.City || ''}
                                    onChange={handleChange}
                                    placeholder="City"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="Address.State">State</Label>
                                <Input
                                    id="Address.State"
                                    name="Address.State"
                                    type="text"
                                    value={formData.Address?.State || ''}
                                    onChange={handleChange}
                                    placeholder="State"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="Address.Country">Country</Label>
                                <Input
                                    id="Address.Country"
                                    name="Address.Country"
                                    type="text"
                                    value={formData.Address?.Country || ''}
                                    onChange={handleChange}
                                    placeholder="Country"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="Address.ZipCode">Zip Code</Label>
                                <Input
                                    id="Address.ZipCode"
                                    name="Address.ZipCode"
                                    type="text"
                                    value={formData.Address?.ZipCode || ''}
                                    onChange={handleChange}
                                    placeholder="Zip code"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-6">
                        {editingUser && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={resetForm}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                        )}
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="min-w-[120px]"
                        >
                            {isSubmitting && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            {isSubmitting
                                ? 'Saving...'
                                : editingUser
                                    ? 'Update User'
                                    : 'Add User'
                            }
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
} 