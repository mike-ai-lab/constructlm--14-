// All test examples for the Enhanced React Component Renderer
window.EXAMPLES = {
  // Basic Tests
  counter: `function Counter() {
  const [count, setCount] = React.useState(0);
  
  return (
    <div className="p-8 bg-white rounded-xl shadow-lg max-w-sm mx-auto mt-10">
      <h1 className="text-3xl font-bold text-blue-600 mb-4">Counter App</h1>
      <div className="text-6xl font-bold text-center mb-6">{count}</div>
      <div className="flex gap-2">
        <button 
          onClick={() => setCount(count - 1)}
          className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold"
        >
          Decrease
        </button>
        <button 
          onClick={() => setCount(0)}
          className="flex-1 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold"
        >
          Reset
        </button>
        <button 
          onClick={() => setCount(count + 1)}
          className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold"
        >
          Increase
        </button>
      </div>
    </div>
  );
}

return Counter;`,

  todo: `function TodoList() {
  const [todos, setTodos] = React.useState(['Learn React', 'Build a project']);
  const [input, setInput] = React.useState('');
  
  const addTodo = () => {
    if (input.trim()) {
      setTodos([...todos, input]);
      setInput('');
    }
  };
  
  const removeTodo = (index) => {
    setTodos(todos.filter((_, i) => i !== index));
  };
  
  return (
    <div className="p-8 bg-gradient-to-br from-purple-50 to-blue-50 min-h-screen">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-2xl font-bold text-purple-600 mb-4">My Todo List</h1>
        
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addTodo()}
            placeholder="Add a new task..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button 
            onClick={addTodo}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold"
          >
            Add
          </button>
        </div>
        
        <ul className="space-y-2">
          {todos.map((todo, index) => (
            <li key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
              <span className="text-gray-700">{todo}</span>
              <button 
                onClick={() => removeTodo(index)}
                className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

return TodoList;`,

  colorpicker: `function ColorPicker() {
  const [color, setColor] = React.useState('#3b82f6');
  
  const colors = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308', 
    '#84cc16', '#22c55e', '#10b981', '#14b8a6',
    '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
    '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'
  ];
  
  return (
    <div className="p-8 min-h-screen flex items-center justify-center" style={{backgroundColor: color}}>
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Color Picker</h1>
        <p className="text-gray-500 mb-6">Choose your favorite color</p>
        
        <div className="mb-6">
          <div className="text-center mb-4">
            <div className="inline-block px-6 py-3 rounded-lg text-white font-mono text-lg" style={{backgroundColor: color}}>
              {color}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-4 gap-3">
          {colors.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className="w-full aspect-square rounded-lg transition-transform hover:scale-110 shadow-md"
              style={{backgroundColor: c}}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

return ColorPicker;`,

  login: `function LoginForm() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [submitted, setSubmitted] = React.useState(false);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back</h1>
        <p className="text-gray-500 mb-6">Please login to your account</p>
        
        {submitted && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            Login successful!
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="you@example.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your password"
            />
          </div>
          
          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}

return LoginForm;`,

  gallery: `function CardGallery() {
  const [selected, setSelected] = React.useState(null);
  
  const cards = [
    { id: 1, title: 'Mountain View', desc: 'Beautiful mountain landscape', color: 'from-blue-400 to-blue-600' },
    { id: 2, title: 'Ocean Waves', desc: 'Peaceful ocean scenery', color: 'from-cyan-400 to-blue-500' },
    { id: 3, title: 'Forest Path', desc: 'Green forest trail', color: 'from-green-400 to-emerald-600' },
    { id: 4, title: 'Desert Sunset', desc: 'Golden desert view', color: 'from-orange-400 to-red-500' },
    { id: 5, title: 'City Lights', desc: 'Urban night scene', color: 'from-purple-400 to-pink-500' },
    { id: 6, title: 'Aurora Sky', desc: 'Northern lights display', color: 'from-indigo-400 to-purple-600' }
  ];
  
  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">Image Gallery</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {cards.map((card) => (
          <div
            key={card.id}
            onClick={() => setSelected(card.id)}
            className={\`cursor-pointer transform transition-all duration-300 \${
              selected === card.id ? 'scale-105 shadow-2xl' : 'hover:scale-105 shadow-lg'
            }\`}
          >
            <div className={\`bg-gradient-to-br \${card.color} rounded-xl p-6 h-48 flex flex-col justify-end text-white\`}>
              <h3 className="text-2xl font-bold mb-2">{card.title}</h3>
              <p className="text-white/90">{card.desc}</p>
            </div>
            {selected === card.id && (
              <div className="bg-white p-4 rounded-b-xl">
                <p className="text-green-600 font-semibold">Selected!</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

return CardGallery;`,

  // Advanced Tests - Proof of Power
  typescript: `function TypeScriptDemo() {
  const [count, setCount] = React.useState<number>(0);
  
  const increment = (amount: number): void => {
    setCount(count + amount);
  };
  
  return (
    <div className="p-8 bg-gradient-to-br from-purple-500 to-pink-500 min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-2xl">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">TypeScript Works!</h1>
        <p className="text-gray-600 mb-6">Type annotations are fully supported</p>
        <div className="text-6xl font-bold text-center mb-6 text-purple-600">{count}</div>
        <div className="flex gap-2">
          <button 
            onClick={() => increment(1)}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold"
          >
            +1
          </button>
          <button 
            onClick={() => increment(5)}
            className="px-6 py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-lg font-semibold"
          >
            +5
          </button>
        </div>
      </div>
    </div>
  );
}

return TypeScriptDemo;`,

  iconsdemo: `import React, { useState } from 'react';
import { Heart, Star, Mail } from 'lucide-react';

function IconDemo() {
  const [liked, setLiked] = useState(false);
  const [rating, setRating] = useState(0);
  
  return (
    <div className="p-8 bg-gradient-to-br from-blue-500 to-cyan-500 min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Icons Work!</h1>
        <p className="text-gray-600 mb-6">Lucide imports are mocked automatically</p>
        
        <div className="space-y-4">
          <button 
            onClick={() => setLiked(!liked)}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold"
          >
            <Heart className={liked ? 'fill-current' : ''} />
            {liked ? 'Liked!' : 'Like'}
          </button>
          
          <div className="flex gap-2 justify-center">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                onClick={() => setRating(n)}
                className="p-2"
              >
                <Star className={n <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
              </button>
            ))}
          </div>
          
          <button className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold">
            <Mail />
            Contact
          </button>
        </div>
      </div>
    </div>
  );
}

export default IconDemo;`,

  complexstate: `function TodoApp() {
  const [todos, setTodos] = React.useState([
    { id: 1, text: 'Test TypeScript', done: true },
    { id: 2, text: 'Test imports', done: true },
    { id: 3, text: 'Test complex state', done: false }
  ]);
  const [input, setInput] = React.useState('');
  
  const addTodo = () => {
    if (input.trim()) {
      setTodos([...todos, { id: Date.now(), text: input, done: false }]);
      setInput('');
    }
  };
  
  const toggleTodo = (id) => {
    setTodos(todos.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };
  
  const deleteTodo = (id) => {
    setTodos(todos.filter(t => t.id !== id));
  };
  
  const stats = {
    total: todos.length,
    done: todos.filter(t => t.done).length,
    pending: todos.filter(t => !t.done).length
  };
  
  return (
    <div className="p-8 bg-gradient-to-br from-green-500 to-emerald-500 min-h-screen">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Complex State Works!</h1>
          <p className="text-gray-600 mb-6">Arrays, objects, and nested state</p>
          
          <div className="flex gap-4 mb-6">
            <div className="flex-1 bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="flex-1 bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">{stats.done}</div>
              <div className="text-sm text-gray-600">Done</div>
            </div>
            <div className="flex-1 bg-orange-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
          </div>
          
          <div className="flex gap-2 mb-6">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTodo()}
              placeholder="Add new task..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button 
              onClick={addTodo}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold"
            >
              Add
            </button>
          </div>
          
          <div className="space-y-2">
            {todos.map(todo => (
              <div key={todo.id} className="flex items-center gap-3 bg-gray-50 p-4 rounded-lg">
                <input
                  type="checkbox"
                  checked={todo.done}
                  onChange={() => toggleTodo(todo.id)}
                  className="w-5 h-5"
                />
                <span className={\`flex-1 \${todo.done ? 'line-through text-gray-400' : 'text-gray-700'}\`}>
                  {todo.text}
                </span>
                <button 
                  onClick={() => deleteTodo(todo.id)}
                  className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

return TodoApp;`,

  hooks: `import React, { useState, useEffect, useRef } from 'react';

function AdvancedHooks() {
  const [time, setTime] = useState(new Date());
  const [color, setColor] = useState('#3b82f6');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText(\`Mouse: \${mousePos.x}, \${mousePos.y}\`, 10, 30);
  }, [color, mousePos]);
  
  const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
  
  return (
    <div className="p-8 bg-gradient-to-br from-indigo-500 to-purple-500 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Advanced Hooks Work!</h1>
          <p className="text-gray-600 mb-6">useEffect, useRef, and event listeners</p>
          
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-bold text-gray-700 mb-2">Live Clock</h3>
              <div className="text-4xl font-mono text-blue-600">
                {time.toLocaleTimeString()}
              </div>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-bold text-gray-700 mb-2">Mouse Position</h3>
              <div className="text-2xl font-mono text-green-600">
                X: {mousePos.x}, Y: {mousePos.y}
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="font-bold text-gray-700 mb-3">Canvas with useRef</h3>
            <canvas 
              ref={canvasRef} 
              width={600} 
              height={200}
              className="border-2 border-gray-300 rounded-lg w-full"
            />
          </div>
          
          <div>
            <h3 className="font-bold text-gray-700 mb-3">Change Canvas Color</h3>
            <div className="flex gap-2">
              {colors.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className="w-12 h-12 rounded-lg border-2 border-gray-300 hover:scale-110 transition-transform"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdvancedHooks;`,

  carousel: `import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const Carousel = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const slides = [
    { id: 1, title: 'Slide 1', color: 'from-blue-500 to-cyan-500', desc: 'Beautiful gradient' },
    { id: 2, title: 'Slide 2', color: 'from-purple-500 to-pink-500', desc: 'Stunning colors' },
    { id: 3, title: 'Slide 3', color: 'from-green-500 to-emerald-500', desc: 'Nature vibes' },
    { id: 4, title: 'Slide 4', color: 'from-orange-500 to-red-500', desc: 'Warm sunset' }
  ];

  const nextSlide = () => {
    setActiveIndex((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-8">
      <div className="max-w-4xl w-full">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">Carousel with Framer Motion</h1>
        
        <div className="relative h-96 overflow-hidden rounded-2xl shadow-2xl">
          {slides.map((slide, index) => (
            <motion.div
              key={slide.id}
              initial={{ x: index === activeIndex ? 0 : '100%' }}
              animate={{ x: index === activeIndex ? 0 : index < activeIndex ? '-100%' : '100%' }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className={\`absolute inset-0 bg-gradient-to-br \${slide.color} flex flex-col items-center justify-center text-white\`}
            >
              <h2 className="text-6xl font-bold mb-4">{slide.title}</h2>
              <p className="text-2xl">{slide.desc}</p>
            </motion.div>
          ))}
          
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 p-3 rounded-full backdrop-blur-sm transition-all"
          >
            <FiChevronLeft size={32} className="text-white" />
          </button>
          
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 p-3 rounded-full backdrop-blur-sm transition-all"
          >
            <FiChevronRight size={32} className="text-white" />
          </button>
        </div>
        
        <div className="flex justify-center gap-2 mt-6">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={\`w-3 h-3 rounded-full transition-all \${
                index === activeIndex ? 'bg-white w-8' : 'bg-white/50'
              }\`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Carousel;`
};
