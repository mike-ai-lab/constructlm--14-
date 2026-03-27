export default function Button() {
  const [count, setCount] = React.useState(0);

  return (
    <button style={{ backgroundColor: '#4CAF50', color: '#fff', padding: '10px 20px', border: 'none', borderRadius: '5px' }} onClick={() => setCount(count + 1)}>
      Click me! ({count})
    </button>
  );
}

FILE: my-project/components/Sidebar.js