() {
  const [metric, setMetric] = React.useState(100);

  return (
    <div style={{ width: '200px', padding: '20px', backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '5px' }}>
      <h2>Metric</h2>
      <p>{metric}</p>
    </div>
  );
}

FILE: my-project/components/Charts.js