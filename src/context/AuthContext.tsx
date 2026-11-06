import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppUser, UserRole, UserApprovalStatus } from '../types/oncology';

interface AuthContextType {
  currentUser: AppUser | null;
  users: AppUser[];
  login: (employeeNumber: string, password: string) => { success: boolean; error?: string; status?: UserApprovalStatus };
  register: (data: {
    firstName: string;
    lastName: string;
    employeeNumber: string;
    email: string;
    password: string;
  }) => { success: boolean; error?: string };
  logout: () => void;
  approveUser: (userId: string) => void;
  rejectUser: (userId: string) => void;
  deleteUser: (userId: string) => void;
  toggleUserRole: (userId: string) => void;
  pendingUsersCount: number;
  isUserManagementOpen: boolean;
  setIsUserManagementOpen: (open: boolean) => void;
  isAdmin: boolean;
}

const USERS_STORAGE_KEY = 'poct_registered_users_v1';
const CURRENT_USER_KEY = 'poct_active_session_user_v1';

const INITIAL_USERS: AppUser[] = [
  {
    id: 'user-admin-1',
    firstName: 'Dr. Mansour',
    lastName: 'MD',
    employeeNumber: '1001',
    email: 'mansourdr2010@gmail.com',
    password: 'admin',
    role: 'admin',
    status: 'approved',
    createdAt: '2026-01-01',
    approvedAt: '2026-01-01',
    approvedBy: 'System Primary Admin',
  },
  {
    id: 'user-doc-2',
    firstName: 'Elena',
    lastName: 'Rostova',
    employeeNumber: '1002',
    email: 'elena.rostova@pedonco.org',
    password: 'password123',
    role: 'physician',
    status: 'approved',
    createdAt: '2026-02-15',
    approvedAt: '2026-02-16',
    approvedBy: 'Dr. Mansour, MD',
  },
  {
    id: 'user-doc-3',
    firstName: 'Sarah',
    lastName: 'Chen',
    employeeNumber: '1003',
    email: 'sarah.chen@pedonco.org',
    password: 'password123',
    role: 'physician',
    status: 'pending',
    createdAt: '2026-10-24',
  },
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<AppUser[]>(() => {
    try {
      const stored = localStorage.getItem(USERS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading users from storage:', e);
    }
    return INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    try {
      const stored = localStorage.getItem(CURRENT_USER_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error loading active session user:', e);
    }
    // Default to admin user for immediate seamless access
    return INITIAL_USERS[0];
  });

  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);

  // Sync users to storage
  useEffect(() => {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch (e) {
      console.error('Failed to sync users to storage:', e);
    }
  }, [users]);

  // Sync session user
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(CURRENT_USER_KEY);
      }
    } catch (e) {
      console.error('Failed to sync active user:', e);
    }
  }, [currentUser]);

  const login = (employeeNumber: string, password: string) => {
    const cleanEmp = employeeNumber.trim();
    const cleanPass = password.trim();

    const user = users.find(
      (u) =>
        u.employeeNumber.toLowerCase() === cleanEmp.toLowerCase() ||
        u.employeeNumber.replace(/\D/g, '') === cleanEmp.replace(/\D/g, '')
    );

    if (!user) {
      return { success: false, error: 'No user registered with this Employee Number.' };
    }

    if (user.password !== cleanPass) {
      return { success: false, error: 'Incorrect password. Please verify and try again.' };
    }

    if (user.status === 'pending') {
      return {
        success: false,
        status: 'pending' as UserApprovalStatus,
        error:
          'Your account is currently pending approval by the Admin (Dr. Mansour). You will be granted access once approved.',
      };
    }

    if (user.status === 'rejected') {
      return {
        success: false,
        status: 'rejected' as UserApprovalStatus,
        error: 'Your access request has been declined by the Admin. Please contact the department.',
      };
    }

    setCurrentUser(user);
    return { success: true };
  };

  const register = (data: {
    firstName: string;
    lastName: string;
    employeeNumber: string;
    email: string;
    password: string;
  }) => {
    const cleanEmp = data.employeeNumber.trim();
    const cleanEmail = data.email.trim().toLowerCase();

    // Check if employee number or email already exists
    const existsEmp = users.some(
      (u) =>
        u.employeeNumber.toLowerCase() === cleanEmp.toLowerCase() ||
        u.employeeNumber.replace(/\D/g, '') === cleanEmp.replace(/\D/g, '')
    );
    if (existsEmp) {
      return { success: false, error: `Employee Number "${cleanEmp}" is already registered.` };
    }

    const existsEmail = users.some((u) => u.email.toLowerCase() === cleanEmail);
    if (existsEmail) {
      return { success: false, error: `Email "${data.email}" is already registered.` };
    }

    const newUser: AppUser = {
      id: `user-${Date.now()}`,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      employeeNumber: cleanEmp,
      email: cleanEmail,
      password: data.password.trim(),
      role: 'physician',
      status: 'pending', // Requires admin approval!
      createdAt: new Date().toISOString().split('T')[0],
    };

    setUsers((prev) => [...prev, newUser]);
    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const approveUser = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          return {
            ...u,
            status: 'approved',
            approvedAt: new Date().toISOString().split('T')[0],
            approvedBy: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Dr. Mansour',
          };
        }
        return u;
      })
    );
  };

  const rejectUser = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          return {
            ...u,
            status: 'rejected',
          };
        }
        return u;
      })
    );
  };

  const deleteUser = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const toggleUserRole = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const nextRole: UserRole = u.role === 'admin' ? 'physician' : 'admin';
          return { ...u, role: nextRole };
        }
        return u;
      })
    );
  };

  const pendingUsersCount = users.filter((u) => u.status === 'pending').length;
  const isAdmin = currentUser?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        login,
        register,
        logout,
        approveUser,
        rejectUser,
        deleteUser,
        toggleUserRole,
        pendingUsersCount,
        isUserManagementOpen,
        setIsUserManagementOpen,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
