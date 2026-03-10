import React from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import MetricCard from '../components/MetricCard';
import Charts from '../components/Charts';
import ActivityTable from '../components/ActivityTable';

export default function Dashboard() {
  const styles = {
    dashboard: { display: 'flex' },
    main: { width: '100%', padding: '20px' }
  };

  return (
    <div style={styles.dashboard}>
      <Sidebar />
      <div style={styles.main}>
        <Header />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <MetricCard title="Users" value="100" icon="fa fa-users" />
          <MetricCard title="Sales" value="1000" icon="fa fa-dollar" />
          <MetricCard title="Views" value="10000" icon="fa fa-eye" />
        </div>
        <Charts />
        <ActivityTable />
      </div>
    </div>
  );
}