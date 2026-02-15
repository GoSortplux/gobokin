import React from 'react';
import { UserCircle, Building, Users, ShieldCheck } from 'lucide-react';

interface RoleSelectionModalProps {
  isOpen: boolean;
  roles: string[];
  onSelect: (role: string) => void;
  onClose: () => void;
}

const RoleSelectionModal: React.FC<RoleSelectionModalProps> = ({ isOpen, roles, onSelect, onClose }) => {
  if (!isOpen) return null;

  const getRoleConfig = (role: string) => {
    switch (role) {
      case 'user':
        return {
          label: 'Customer',
          icon: <UserCircle className="w-6 h-6" />,
          description: 'Book venues and manage your reservations'
        };
      case 'hall-owner':
        return {
          label: 'Venue Owner',
          icon: <Building className="w-6 h-6" />,
          description: 'Manage your venues and bookings'
        };
      case 'staff':
        return {
          label: 'Staff',
          icon: <Users className="w-6 h-6" />,
          description: 'Help manage venues and reservations'
        };
      case 'super-admin':
        return {
          label: 'Admin',
          icon: <ShieldCheck className="w-6 h-6" />,
          description: 'Full system administration access'
        };
      default:
        return {
          label: role.charAt(0).toUpperCase() + role.slice(1),
          icon: <UserCircle className="w-6 h-6" />,
          description: `Access your ${role} account`
        };
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Choose your account</h2>
          <p className="text-sm text-gray-500 mt-1">Select the role you want to use for this session</p>
        </div>

        <div className="p-6 space-y-3">
          {roles.map((role) => {
            const config = getRoleConfig(role);
            return (
              <button
                key={role}
                onClick={() => onSelect(role)}
                className="w-full flex items-start p-4 rounded-xl border-2 border-gray-100 hover:border-primary hover:bg-primary/5 transition-all text-left group"
              >
                <div className="p-2 rounded-lg bg-gray-50 text-gray-500 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  {config.icon}
                </div>
                <div className="ml-4">
                  <p className="font-bold text-gray-900 group-hover:text-primary transition-colors capitalize">
                    {config.label}
                  </p>
                  <p className="text-sm text-gray-500">{config.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="p-4 bg-gray-50 text-center">
          <button
            onClick={onClose}
            className="text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            Cancel and go back
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleSelectionModal;
