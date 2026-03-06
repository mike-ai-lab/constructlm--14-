# Canvas Runtime Bundler - Test Examples

These examples demonstrate the new capabilities of the canvas runtime bundler. All of these should now render successfully.

## Test 1: Basic Component with Imports

```tsx
import { useState } from "react";

export default function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-500 to-pink-500">
      <div className="bg-white rounded-lg shadow-2xl p-8">
        <h1 className="text-4xl font-bold mb-4 text-gray-800">Count: {count}</h1>
        <div className="flex gap-4">
          <button
            onClick={() => setCount(count - 1)}
            className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
          >
            Decrement
          </button>
          <button
            onClick={() => setCount(count + 1)}
            className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
          >
            Increment
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Expected**: ✅ Renders with working state management

---

## Test 2: Routing with Wouter

```tsx
import { Link, Route, Switch } from "wouter";
import { useState } from "react";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-md p-4">
        <div className="max-w-4xl mx-auto flex gap-6">
          <Link href="/">
            <a className="text-blue-600 hover:text-blue-800 font-semibold">Home</a>
          </Link>
          <Link href="/about">
            <a className="text-blue-600 hover:text-blue-800 font-semibold">About</a>
          </Link>
          <Link href="/contact">
            <a className="text-blue-600 hover:text-blue-800 font-semibold">Contact</a>
          </Link>
        </div>
      </nav>
      
      <div className="max-w-4xl mx-auto p-8">
        <Switch>
          <Route path="/">
            <HomePage />
          </Route>
          <Route path="/about">
            <AboutPage />
          </Route>
          <Route path="/contact">
            <ContactPage />
          </Route>
        </Switch>
      </div>
    </div>
  );
}

function HomePage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Welcome Home</h1>
      <p className="text-gray-600">This is the home page with client-side routing.</p>
    </div>
  );
}

function AboutPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">About Us</h1>
      <p className="text-gray-600">Learn more about our application.</p>
    </div>
  );
}

function ContactPage() {
  const [email, setEmail] = useState("");
  
  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Contact</h1>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email"
        className="border rounded px-4 py-2 w-full max-w-md"
      />
    </div>
  );
}
```

**Expected**: ✅ Full routing functionality with navigation

---

## Test 3: Framer Motion Animations

```tsx
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

export default function AnimatedCards() {
  const [cards, setCards] = useState([
    { id: 1, title: "Card 1", color: "bg-blue-500" },
    { id: 2, title: "Card 2", color: "bg-green-500" },
    { id: 3, title: "Card 3", color: "bg-purple-500" },
  ]);
  
  const removeCard = (id) => {
    setCards(cards.filter(card => card.id !== id));
  };
  
  const addCard = () => {
    const newId = Math.max(...cards.map(c => c.id), 0) + 1;
    const colors = ["bg-red-500", "bg-yellow-500", "bg-pink-500", "bg-indigo-500"];
    const color = colors[Math.floor(Math.random() * colors.length)];
    setCards([...cards, { id: newId, title: `Card ${newId}`, color }]);
  };
  
  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Animated Cards</h1>
        
        <button
          onClick={addCard}
          className="mb-6 px-6 py-3 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100 transition"
        >
          Add Card
        </button>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <AnimatePresence>
            {cards.map(card => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: -20 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`${card.color} rounded-lg p-6 cursor-pointer`}
                onClick={() => removeCard(card.id)}
              >
                <h3 className="text-2xl font-bold text-white">{card.title}</h3>
                <p className="text-white/80 mt-2">Click to remove</p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
```

**Expected**: ✅ Smooth animations with enter/exit transitions

---

## Test 4: Path Aliases with Mock Components

```tsx
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { HomeIcon, UserIcon, SettingsIcon } from "lucide-react";
import { useState } from "react";

export default function Dashboard() {
  const [username, setUsername] = useState("");
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gray-800">Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <div className="flex items-center gap-4">
              <HomeIcon size={32} />
              <div>
                <h3 className="font-bold text-lg">Home</h3>
                <p className="text-gray-600">Main dashboard</p>
              </div>
            </div>
          </Card>
          
          <Card>
            <div className="flex items-center gap-4">
              <UserIcon size={32} />
              <div>
                <h3 className="font-bold text-lg">Profile</h3>
                <p className="text-gray-600">User settings</p>
              </div>
            </div>
          </Card>
          
          <Card>
            <div className="flex items-center gap-4">
              <SettingsIcon size={32} />
              <div>
                <h3 className="font-bold text-lg">Settings</h3>
                <p className="text-gray-600">Configuration</p>
              </div>
            </div>
          </Card>
        </div>
        
        <Card>
          <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
          <div className="space-y-4">
            <Input
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <Button>Save Changes</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
```

**Expected**: ✅ Renders with mock components for Button, Card, Input, and icons

---

## Test 5: Complex Todo App with Multiple Features

```tsx
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function TodoApp() {
  const [todos, setTodos] = useState([]);
  const [input, setInput] = useState("");
  const [filter, setFilter] = useState("all");
  
  const addTodo = () => {
    if (input.trim()) {
      setTodos([
        ...todos,
        { id: Date.now(), text: input, completed: false, createdAt: new Date() }
      ]);
      setInput("");
    }
  };
  
  const toggleTodo = (id) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };
  
  const deleteTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };
  
  const filteredTodos = todos.filter(todo => {
    if (filter === "active") return !todo.completed;
    if (filter === "completed") return todo.completed;
    return true;
  });
  
  const stats = {
    total: todos.length,
    active: todos.filter(t => !t.completed).length,
    completed: todos.filter(t => t.completed).length
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 p-8">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-2xl p-8"
        >
          <h1 className="text-4xl font-bold mb-2 text-gray-800">Todo List</h1>
          <p className="text-gray-600 mb-6">
            {stats.active} active • {stats.completed} completed • {stats.total} total
          </p>
          
          {/* Input */}
          <div className="flex gap-2 mb-6">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTodo()}
              placeholder="What needs to be done?"
              className="flex-1 border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-purple-500 focus:outline-none"
            />
            <button
              onClick={addTodo}
              className="px-6 py-3 bg-purple-500 text-white rounded-lg font-semibold hover:bg-purple-600 transition"
            >
              Add
            </button>
          </div>
          
          {/* Filters */}
          <div className="flex gap-2 mb-6">
            {["all", "active", "completed"].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === f
                    ? "bg-purple-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          
          {/* Todo List */}
          <div className="space-y-2">
            <AnimatePresence>
              {filteredTodos.map(todo => (
                <motion.div
                  key={todo.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className={`flex items-center gap-3 p-4 rounded-lg border-2 transition ${
                    todo.completed
                      ? "bg-gray-50 border-gray-200"
                      : "bg-white border-purple-200"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => toggleTodo(todo.id)}
                    className="w-5 h-5 cursor-pointer"
                  />
                  <span
                    className={`flex-1 ${
                      todo.completed
                        ? "line-through text-gray-400"
                        : "text-gray-800"
                    }`}
                  >
                    {todo.text}
                  </span>
                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className="px-3 py-1 text-red-500 hover:bg-red-50 rounded transition"
                  >
                    Delete
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          
          {filteredTodos.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-lg">No todos {filter !== "all" && `in ${filter}`}</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
```

**Expected**: ✅ Fully functional todo app with filtering, animations, and state management

---

## Test 6: Data Fetching and Async Operations

```tsx
import { useState, useEffect } from "react";

export default function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      try {
        const mockUsers = [
          { id: 1, name: "John Doe", email: "john@example.com", role: "Admin" },
          { id: 2, name: "Jane Smith", email: "jane@example.com", role: "User" },
          { id: 3, name: "Bob Johnson", email: "bob@example.com", role: "User" },
          { id: 4, name: "Alice Williams", email: "alice@example.com", role: "Manager" },
        ];
        setUsers(mockUsers);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    }, 1000);
  }, []);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Loading users...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-red-800 font-bold text-xl mb-2">Error</h2>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gray-800">User Directory</h1>
        
        <div className="grid gap-4">
          {users.map(user => (
            <div
              key={user.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{user.name}</h3>
                  <p className="text-gray-600">{user.email}</p>
                </div>
                <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  user.role === "Admin"
                    ? "bg-purple-100 text-purple-800"
                    : user.role === "Manager"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-gray-100 text-gray-800"
                }`}>
                  {user.role}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

**Expected**: ✅ Shows loading state, then renders user list

---

## How to Test

1. Copy any of the code examples above
2. Paste into your chat with the AI
3. Ask: "Render this component in the canvas"
4. The AI will output the code in a TSX code block
5. Click the "Open in Canvas" button (Maximize icon)
6. The component should render successfully with all features working

## What Changed

**Before**: Import statements caused `ReferenceError: Link is not defined`

**After**: 
- Imports are parsed and resolved
- External packages loaded from CDN
- Missing imports replaced with mocks
- Full error boundaries with helpful messages
- Preloaded React environment

All examples above should now work perfectly in your canvas!
