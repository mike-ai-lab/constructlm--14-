import React from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import MetricCard from '../components/MetricCard';
import Charts from '../components/Charts';
import ActivityTable from '../components/ActivityTable';

export default function Dashboard() {
  const styles = {
    dashboard: { 
      display: 'flex' 
    },
    main: { 
      width: '100%', 
      padding: '20px' 
    }
  };

  return (
    <div style={styles.dashboard}>
      <Sidebar />
      <div style={styles.main}>
        <Header />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <MetricCard title="Users" value="100" icon="👥" />
          <MetricCard title="Views" value="1000" icon="📊" />
          <MetricCard title="Clicks" value="500" icon="👍" />
        </div>
        <Charts />
        <ActivityTable />
      </div>
    </div>
  );
}
```

Note: This code is a basic implementation of a modern analytics dashboard. You may need to modify it to fit your specific requirements. Additionally, you will need to implement the rendering of the line and bar charts using a library such as Chart.js.