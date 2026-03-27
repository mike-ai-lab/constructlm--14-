function MetricCard() {
  const [metric, setMetric] = useState(100);

  return (
    <div
      style={{
        backgroundColor: 'white',
        padding: '20px',
        border: '1px solid lightgray',
        borderRadius: '5px',
        width: '200px',
        height: '100px',
      }}
    >
      <h3>Metric: {metric}</h3>
      <button
        style={{
          backgroundColor: 'blue',
          color: 'white',
          padding: '10px',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
        }}
        onClick={() => setMetric(metric + 10)}
      >
        Increase
      </button>
    </div>
  );
}

export default MetricCard;

FILE: my-project/components/Charts.js