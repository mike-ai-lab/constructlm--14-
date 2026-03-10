### The request:

> **design a simple react component of a login page, just a frontend demo in a single .tsx file**


## The ai is generating 2 files when i request a react component:

## First file Login.tsx:
```
import React, { useState } from 'react';

interface LoginProps {
}

const Login: React.FC<LoginProps> = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (username === '' || password === '') {
      setError('Please fill in both username and password');
    } else {
      // Call API to login
      console.log('Login with username:', username, 'and password:', password);
    }
  };

  return (
    <div>
      <h1>Login Page</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Username:
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
        </label>
        <br />
        <label>
          Password:
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <br />
        <button type="submit">Login</button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </form>
    </div>
  );
};

export default Login;
```

### The second file index.tsx:
```
import React from 'react';
import ReactDOM from 'react-dom';
import Login from './Login';

ReactDOM.render(
  <React.StrictMode>
    <Login />
  </React.StrictMode>,
  document.getElementById('root')
);
```

### Third file index.js **empty**