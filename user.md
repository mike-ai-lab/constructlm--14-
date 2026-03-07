
  /** Form submit handler */
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({ email, password });
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div style={{ marginBottom: "1rem" }}>
        <label htmlFor="login-email" style={{ display: "block" }}>
          Email
        </label>
        <input
          id="login-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={disabled}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
          style={{ width: "100%", padding: "0.5rem" }}
        />
        {errors.email && (
          <p id="email-error" style={{ color: "red", marginTop: "0.25rem" }}>
            {errors.email}
          </p>
        )}
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <label htmlFor="login-password" style={{ display: "block" }}>
          Password
        </label>
        <input
          id="login-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={disabled}
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? "password-error" : undefined}
          style={{ width: "100%", padding: "0.5rem" }}
        />
        {errors.password && (
          <p
            id="password-error"
            style={{ color: "red", marginTop: "0.25rem" }}
          >
            {errors.password}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={disabled}
        style={{
          padding: "0.5rem 1rem",
          backgroundColor: "#0069d9",
          color: "#fff",
          border: "none",
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        {disabled ? "Signing in…" : "Sign In"}
      </button>
    </form>
  );
};
```

### How to use it

```tsx
import React, { useState } from "react";
import { LoginForm } from "./LoginForm";

export const App: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const handleLogin = async ({ email, password }: { email: string; password: string }) => {
    setLoading(true);
    try {
      // Replace with your actual authentication call
      await fakeAuthApi(email, password);
      alert("Login successful!");
    } catch (err) {
      alert("Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "2rem auto" }}>
      <h2>Login</h2>
      <LoginForm onSubmit={handleLogin} disabled={loading} />
    </div>
  );
};

/* Mock API – replace with real implementation */
const fakeAuthApi = (email: string, password: string) =>
  new Promise<void>((resolve, reject) => {
    setTimeout(() => (email === "test@example.com" && password === "secret"
      ? resolve()
      : reject()), 1000);
  });
```

### Key points

| Feature | Implementation |
|---------|----------------|
| **State handling** | `useState` for email, password, and validation errors |
| **Validation** | Simple client‑side checks (required fields, email format, min password length) |
| **Accessibility** | `<label>` linked via `htmlFor`, `aria-invalid`, and descriptive error IDs |
| **Disabled / loading** | Prop `disabled` disables inputs and button, useful while awaiting a request |
| **Styling** | Inline styles for brevity; replace with CSS modules, Tailwind, or a UI library as needed |
| **Reusability** | The component receives an `onSubmit` callback, keeping it UI‑only and easy to test |

Feel free to adapt the styling or validation logic to match your project's design system or security requirements.

*Token Usage: Input 12 • Output 1302*

---

