'use client';

import { User } from '@/lib/types';

interface UsersListProps {
    users: User[];
    loading: boolean;
    onEditUser: (user: User) => void;
    onDeleteUser: (userId: string) => void;
}

export default function UsersList({ users, loading, onEditUser, onDeleteUser }: UsersListProps) {
    const formatAddress = (address: User['Address']) => {
        if (!address) return 'Not provided';

        const parts = [];
        if (address.AddressLine1) parts.push(address.AddressLine1);
        if (address.AddressLine2) parts.push(address.AddressLine2);
        if (address.City) parts.push(address.City);
        if (address.State) parts.push(address.State);
        if (address.Country) parts.push(address.Country);
        if (address.ZipCode) parts.push(address.ZipCode);

        return parts.length > 0 ? parts.join(', ') : 'Not provided';
    };

    return (
        <div className="bg-white shadow-md rounded-lg overflow-hidden mt-8">
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                <h2 className="text-xl font-semibold text-gray-800">Users</h2>
            </div>

            <div className="p-6">
                {loading ? (
                    <div className="text-center py-4">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-blue-600"></div>
                        <p className="mt-2 text-gray-500">Loading users...</p>
                    </div>
                ) : users.length === 0 ? (
                    <p className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                        No users found. Add a new user to get started.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
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
                                    <tr key={user._id} className="hover:bg-gray-50">
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
                                                {formatAddress(user.Address)}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 border-b border-gray-200 text-right">
                                            <button
                                                onClick={() => onEditUser(user)}
                                                className="text-blue-600 hover:text-blue-900 mr-4"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => onDeleteUser(user._id!)}
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
    );
} 