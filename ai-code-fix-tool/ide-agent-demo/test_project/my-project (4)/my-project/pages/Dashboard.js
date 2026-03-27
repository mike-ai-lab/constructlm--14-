from '../components/Sidebar';
import MetricCard from '../components/MetricCard';
import Charts from '../components/Charts';

function Dashboard() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        height: '100vh',
      }}
    >
      <Sidebar />
      <div
        style={{
          flex: '1',
          padding: '20px',
        }}
      >
        <Header />
        <MetricCard />
        <Charts />
      </div>
    </div>
  );
}

export default Dashboard;

FILE: my-project/hooks/useCounter.js