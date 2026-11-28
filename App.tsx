import React, { useState } from 'react';
import { UserProfile, UserRole, AppLanguage, BioMaterialListing, AdminUser } from './types';
import HomeDashboard from './components/HomeDashboard';
import HerdPage from './components/HerdPage';
import HealthAlerts from './components/HealthAlerts';
import AskPage from './components/AskPage';
import CareHub from './components/CareHub';
import ProfitDashboard from './components/ProfitDashboard';
import AdminLogin from './components/admin/AdminLogin';
import AdminDashboard from './components/admin/AdminDashboard';
import { NotificationReminderBar } from './components/NotificationReminderBar';
import { OfflineModeManager } from './components/OfflineModeManager';

const DEMO_ADMIN_ENABLED =
  import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEMO_ADMIN === 'true';

const App: React.FC = () => {
  // This UI currently uses local prototype data. Do not enter real farmer data.
  const [profile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('aniguard_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (_) {}
    }
    return {
      name: 'Ramesh Patel',
      role: UserRole.FARMER,
      region: 'Anand, Gujarat',
      language: AppLanguage.ENGLISH,
      coords: { lat: 22.5645, lng: 72.9289 }
    };
  });

  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => {
    if (!DEMO_ADMIN_ENABLED) {
      localStorage.removeItem('aniguard_admin');
      return null;
    }
    try {
      const saved = localStorage.getItem('aniguard_admin');
      const parsed = saved ? JSON.parse(saved) : null;
      return parsed?.isDemo === true ? parsed : null;
    } catch {
      localStorage.removeItem('aniguard_admin');
      return null;
    }
  });
  const [showAdminGateway, setShowAdminGateway] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [careSubPage, setCareSubPage] = useState('vaccines');

  const handleNavigate = (tab: string, sub?: string) => {
    setActiveTab(tab);
    if (tab === 'care' && sub) setCareSubPage(sub);
  };

  const [listings, setListings] = useState<BioMaterialListing[]>(() => {
    try {
      const saved = localStorage.getItem('aniguard_listings');
      return saved ? JSON.parse(saved) : [
        { id: '1', farmerName: 'Rajesh Kumar', materialName: 'Organic Dung', quantity: 500, region: 'Punjab', coords: { lat: 30.901, lng: 75.857 }, contactInfo: 'Demo listing', availableDate: '2024-05-20' },
        { id: '2', farmerName: 'Venkatesh Rao', materialName: 'Dry Neem Leaves', quantity: 200, region: 'Andhra Pradesh', coords: { lat: 17.385, lng: 78.486 }, contactInfo: 'Demo listing', availableDate: '2024-05-10' },
      ];
    } catch {
      localStorage.removeItem('aniguard_listings');
      return [];
    }
  });

  const handleAdminLogin = (user: AdminUser) => {
    if (!DEMO_ADMIN_ENABLED || user.isDemo !== true) return;
    setAdminUser(user);
    localStorage.setItem('aniguard_admin', JSON.stringify(user));
    setShowAdminGateway(false);
  };

  const handleAdminLogout = () => {
    setAdminUser(null);
    localStorage.removeItem('aniguard_admin');
  };

  const handleDeleteListing = (id: string) => {
    const updated = listings.filter(l => l.id !== id);
    setListings(updated);
    localStorage.setItem('aniguard_listings', JSON.stringify(updated));
  };

  if (adminUser && DEMO_ADMIN_ENABLED && adminUser.isDemo === true) {
    return (
      <AdminDashboard
        user={adminUser}
        onLogout={handleAdminLogout}
        listings={listings}
        onDeleteListing={handleDeleteListing}
      />
    );
  }

  if (showAdminGateway) {
    return <AdminLogin onLogin={handleAdminLogin} onClose={() => setShowAdminGateway(false)} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'herd': return <HerdPage profile={profile} />;
      case 'alerts': return <HealthAlerts profile={profile} />;
      case 'care': return <CareHub profile={profile} initialSubPage={careSubPage} />;
      case 'ask': return <AskPage profile={profile} />;
      case 'profit': return <ProfitDashboard profile={profile} onBack={() => setActiveTab('home')} />;
      default: return <HomeDashboard profile={profile} onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col pb-28 transition-colors duration-300" style={{ backgroundColor: '#f3f2ed' }}>
      <button
        onClick={() => setShowAdminGateway(true)}
        className="fixed top-0 right-0 w-8 h-8 opacity-0 hover:opacity-10 cursor-default z-[9999]"
        title="Demo management entry"
        aria-label="Open demo management gateway"
      />

      <main className="flex-1 w-full max-w-lg mx-auto px-4 pt-4 pb-4">
        <div role="note" className="mb-3 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900">
          PROTOTYPE DEMO — sample/local data only. This web UI is not yet connected to live farmer records. Do not enter real personal or animal-health data.
        </div>
        <OfflineModeManager />
        <NotificationReminderBar />
        {renderContent()}
      </main>

      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100]" style={{ width: 'calc(100% - 32px)', maxWidth: '420px' }}>
        <div className="flex justify-around items-center px-2 py-2 rounded-full shadow-2xl" style={{ backgroundColor: '#1a3c2b' }}>
          <NavBtn active={activeTab === 'home' || activeTab === 'profit'} onClick={() => setActiveTab('home')} label="Home" />
          <NavBtn active={activeTab === 'herd'} onClick={() => setActiveTab('herd')} label="Herd" />
          <NavBtn active={activeTab === 'alerts'} onClick={() => setActiveTab('alerts')} label="Alerts" />
          <NavBtn active={activeTab === 'care'} onClick={() => setActiveTab('care')} label="Care" />
          <NavBtn active={activeTab === 'ask'} onClick={() => setActiveTab('ask')} label="Ask" />
        </div>
      </div>
    </div>
  );
};

const NavBtn = ({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) => (
  <button
    onClick={onClick}
    className="px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all active:scale-95"
    style={active ? { backgroundColor: '#F5A623', color: '#1a3c2b' } : { color: '#a5c9b4' }}
  >
    {label}
  </button>
);

export default App;
