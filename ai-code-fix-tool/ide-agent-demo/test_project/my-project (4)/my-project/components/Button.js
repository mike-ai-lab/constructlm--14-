'react';

function Button() {
  const [count, setCount] = useState(0);

  return (
    <button
      style={{
        backgroundColor: 'blue',
        color: 'white',
        padding: '10px',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
      }}
      onClick={() => setCount(count + 1)}
    >
      Click me! ({count})
    </button>
  );
}

export default Button;

FILE: my-project/components/Sidebar.js