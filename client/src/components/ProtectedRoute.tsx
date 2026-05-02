import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUserStore } from '../store/userStore';

interface ProtectedRouteProps {
    allowedRoles: string[];
    children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
    const { token, user } = useUserStore();

    if (!token || !user) {
        return <Navigate to="/login" replace />;
    }

    if (!allowedRoles.includes(user.role)) {
        // Redirect to their default dashboard if they have the wrong role
        if (user.role === 'elderly') return <Navigate to="/elderly" replace />;
        if (user.role === 'volunteer') return <Navigate to="/volunteer" replace />;
        if (user.role === 'admin') return <Navigate to="/admin" replace />;
        return <Navigate to="/login" replace />;
    }

    // Volunteers need to be active to use most features, though they can access their dashboard to see pending status
    return <>{children}</>;
};

export default ProtectedRoute;
