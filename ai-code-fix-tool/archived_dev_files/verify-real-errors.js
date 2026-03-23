// Manual verification of real errors in the test code

const code = `import React, { useState } from "react";
import { Mail, Lock, LogIn } from "lucide-react";

export default function MultiErrorTest() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => { // TypeScript style - ERROR 1: TypeScript syntax not valid in JSX
    e.preventDefault();
    console.log("Submitting:", { email, password })
    alert("Submitting " + email)
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email Address</label  // ERROR 2: Missing > here
          <input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
          >  // ERROR 3: Should be /> not just >
        </div>

        <button type="submit">Sign In</button  // ERROR 4: Missing > here
      </form>
    </div>
  )
}`;

console.log("REAL ERRORS IN THE CODE:");
console.log("1. Line 8: TypeScript syntax 'e: React.FormEvent' - not valid in JSX");
console.log("2. Line 18: Missing '>' on <label> tag");
console.log("3. Line 36: Wrong closing '>' should be '/>' on <input> tag");
console.log("4. Line 40: Missing '>' on <button> tag");
console.log("\nTOTAL REAL ERRORS: 4");
