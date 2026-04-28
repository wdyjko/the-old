import { createBrowserRouter, Navigate } from 'react-router-dom';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';

// Layouts / Protected Routes
import ProtectedRoute from '../components/ProtectedRoute';
import MainLayout from '../components/MainLayout';

// Elderly Pages
import ElderlyDashboard from '../pages/elderly/Dashboard';
import PublishRequest from '../pages/elderly/PublishRequest';
import MyOrders from '../pages/elderly/MyOrders';

// Volunteer Pages
import VolunteerDashboard from '../pages/volunteer/Dashboard';
import TaskMap from '../pages/volunteer/TaskMap';
import PointsMall from '../pages/volunteer/PointsMall';

import AdminDashboard from '../pages/admin/Dashboard';
import UserManagement from '../pages/admin/UserManagement';
import OrderAudit from '../pages/admin/OrderAudit';

export const router = createBrowserRouter([
    { path: '/login', element: <Login /> },
    { path: '/register', element: <Register /> },
    { 
        path: '/', 
        element: <Navigate to="/login" replace /> 
    },
    // Elderly Routes
    {
        path: '/elderly',
        element: <ProtectedRoute allowedRoles={['elderly', 'admin']}><MainLayout role="elderly" /></ProtectedRoute>,
        children: [
            { index: true, element: <ElderlyDashboard /> },
            { path: 'publish', element: <PublishRequest /> },
            { path: 'orders', element: <MyOrders /> },
        ]
    },
    // Volunteer Routes
    {
        path: '/volunteer',
        element: <ProtectedRoute allowedRoles={['volunteer', 'admin']}><MainLayout role="volunteer" /></ProtectedRoute>,
        children: [
            { index: true, element: <VolunteerDashboard /> },
            { path: 'map', element: <TaskMap /> },
            { path: 'mall', element: <PointsMall /> },
        ]
    },
    // Admin Routes
    {
        path: '/admin',
        element: <ProtectedRoute allowedRoles={['admin']}><MainLayout role="admin" /></ProtectedRoute>,
        children: [
            { index: true, element: <AdminDashboard /> },
            { path: 'users', element: <UserManagement /> },
            { path: 'audit', element: <OrderAudit /> },
        ]
    },
    { path: '*', element: <div>404 Not Found</div> }
]);
