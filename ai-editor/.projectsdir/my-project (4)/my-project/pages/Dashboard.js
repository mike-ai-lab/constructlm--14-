react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import MetricCard from '../components/MetricCard';
import Charts from '../components/Charts';

export default function Dashboard() {
  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <Sidebar />
      <div style={{ flex: 1, padding: '20px' }}>
        <Header />
        <MetricCard />
        <Charts />
      </div>
    </div>
  );
}

FILE: my-project/App.js