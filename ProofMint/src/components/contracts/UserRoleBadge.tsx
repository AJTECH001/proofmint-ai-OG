import React from 'react';
import { useUserRoles } from '../../hooks/useContractQueries';

interface UserRoleBadgeProps {
  address: `0x${string}`;
  showAllRoles?: boolean;
}

export const UserRoleBadge: React.FC<UserRoleBadgeProps> = ({
  address,
  showAllRoles = false,
}) => {
  const { data: userRoles, isLoading, error } = useUserRoles(address);

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded-full w-20"></div>
      </div>
    );
  }

  if (error || !userRoles) {
    return (
      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
        Unknown
      </span>
    );
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN_ROLE':
        return 'bg-red-100 text-red-800';
      case 'MERCHANT_ROLE':
        return 'bg-blue-100 text-blue-800';
      case 'RECYCLER_ROLE':
        return 'bg-green-100 text-green-800';
      case 'UPGRADER_ROLE':
        return 'bg-purple-100 text-purple-800';
      case 'VERIFIER_ROLE':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatRoleName = (role: string) => {
    return role.replace('_ROLE', '').toLowerCase().replace(/^\w/, c => c.toUpperCase());
  };

  if (userRoles.roles.length === 0) {
    return (
      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
        User
      </span>
    );
  }

  if (!showAllRoles) {
    const primaryRole = userRoles.roles[0];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(primaryRole)}`}>
        {formatRoleName(primaryRole)}
      </span>
    );
  }

  return (
    <div className="flex flex-wrap gap-1">
      {userRoles.roles.map((role) => (
        <span
          key={role}
          className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(role)}`}
        >
          {formatRoleName(role)}
        </span>
      ))}
    </div>
  );
};