import { useState } from 'react';
import './App.css';
import { TopNav } from './components/TopNav';
import { CalendarScreen } from './screens/CalendarScreen';
import { ReservationFormScreen } from './screens/ReservationFormScreen';
import { AdminDashboardScreen } from './screens/AdminDashboardScreen';
import { MesasScreen } from './screens/MesasScreen';
import { ClienteHistorialScreen } from './screens/ClienteHistorialScreen';

function App() {
  const [activeView, setActiveView] = useState('admin');

  const renderView = () => {
    switch (activeView) {
      case 'calendario':
        return <CalendarScreen />;
      case 'formulario':
        return <ReservationFormScreen />;
      case 'admin':
        return <AdminDashboardScreen />;
      case 'mesas':
        return <MesasScreen />;
      case 'cliente':
        return <ClienteHistorialScreen />;
      default:
        return <CalendarScreen />;
    }
  };

  return (
    <div className="app-root">
      <div className="app-shell">
        <TopNav activeView={activeView} onNavigate={setActiveView} />
        {renderView()}
      </div>
    </div>
  );
}

export default App;
