import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar, Header } from './components/Navigation';
import { DashboardView } from './views/DashboardView';
import { ShipmentsView } from './views/ShipmentsView';
import { FleetView } from './views/FleetView';
import { AnalyticsView } from './views/AnalyticsView';
import { SettingsView } from './views/SettingsView';
import { TrackingView } from './views/TrackingView';
import { InventoryView } from './views/InventoryView';
import { OrdersView } from './views/OrdersView';
import { SupabaseProvider, useAuth } from './components/SupabaseProvider';
import { Login } from './components/Login';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Footer } from './components/Footer';

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/tracking" element={<div className="p-8 min-h-screen bg-slate-50"><TrackingView /></div>} />
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      
      <main className="flex-1 flex flex-col min-w-0">
        <Header />
        
        <div className="flex-1 ml-64 flex flex-col">
          <div className="p-8 flex-1">
            <Routes>
              <Route path="/" element={<DashboardView />} />
              <Route path="/shipments" element={<ShipmentsView />} />
              <Route path="/orders" element={<OrdersView />} />
              <Route path="/inventory" element={<InventoryView />} />
              <Route path="/fleet" element={<FleetView />} />
              <Route path="/analytics" element={<AnalyticsView />} />
              <Route path="/tracking" element={<TrackingView />} />
              <Route path="/settings" element={<SettingsView />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
          <Footer />
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <SupabaseProvider>
        <Router>
          <AppRoutes />
        </Router>
      </SupabaseProvider>
    </ErrorBoundary>
  );
}
