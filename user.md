Good. The way to break a runtime canvas is to target **four weak layers**: compilation, React lifecycle, DOM APIs, and performance loops.
Use these **stress tests**.

---

# 1. Massive React Reconciliation Stress

Forces thousands of elements + state updates.

```tsx
import React, { useState, useEffect } from "react";

export default function StressList() {
  const [items, setItems] = useState<number[]>([]);

  useEffect(() => {
    const arr = Array.from({ length: 5000 }, (_, i) => i);
    setItems(arr);
  }, []);

  return (
    <div className="p-10 space-y-1 text-xs">
      {items.map(i => (
        <div
          key={i}
          className="border border-white/10 p-1 hover:bg-blue-500/10"
        >
          Row #{i}
        </div>
      ))}
    </div>
  );
}
```

Breaks weak renderers with:

* slow reconciliation
* memory spikes

---

# 2. Infinite State Update Loop

Tests React safety handling.

```tsx
import React, { useState, useEffect } from "react";

export default function InfiniteLoop() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(c => c + 1);
  });

  return (
    <div className="p-10 text-white">
      Loop Count: {count}
    </div>
  );
}
```

Weak runtimes:

* freeze iframe
* crash execution

---

# 3. 20k Particle Canvas Physics

Heavy **CPU + animation loop**.

```ts
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const particles = [];

for (let i = 0; i < 20000; i++) {
  particles.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vx: Math.random() * 2 - 1,
    vy: Math.random() * 2 - 1
  });
}

function animate() {
  ctx.fillStyle = "black";
  ctx.fillRect(0,0,canvas.width,canvas.height);

  ctx.fillStyle = "lime";

  for (let p of particles) {
    p.x += p.vx;
    p.y += p.vy;
    ctx.fillRect(p.x,p.y,2,2);
  }

  requestAnimationFrame(animate);
}

animate();
```

Tests:

* DOM bridge
* animation stability
* frame rate

---

# 4. Recursive Component Explosion

```tsx
import React from "react";

function Node({ depth }) {
  if (depth > 10) return null;

  return (
    <div className="ml-2 border-l border-white/10 pl-2">
      Node {depth}
      <Node depth={depth + 1} />
      <Node depth={depth + 1} />
    </div>
  );
}

export default function Tree() {
  return <Node depth={0} />;
}
```

Creates **2046 components** recursively.

Tests:

* stack safety
* reconciliation

---

# 5. Memory Leak Test

```tsx
import React, { useEffect } from "react";

export default function Leak() {
  useEffect(() => {
    const arr = [];

    const interval = setInterval(() => {
      arr.push(new Array(10000).fill(Math.random()));
      console.log("Memory blocks:", arr.length);
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return <div className="p-10">Memory leak running</div>;
}
```

Tests:

* cleanup handling
* iframe isolation

---

# 6. Event Flood Test

```ts
let count = 0;

document.addEventListener("mousemove", () => {
  count++;
  if (count % 500 === 0) {
    console.log("Events:", count);
  }
});
```

Move the mouse fast.

Tests:

* event throughput
* main thread stability

---

# 7. Import Parser Breaker

Attempts to break the tolerant import parser.

```tsx
import { 
  A,,,
  B
  C,
  D,,,,,
} from "lucide-react"

import React,,,, from "react"

export default function App() {
  return <div>Parser Test</div>;
}
```

Tests:

* identifier filtering
* syntax recovery

---

# 8. Async Race Condition

```tsx
import React, { useEffect, useState } from "react";

export default function AsyncRace() {
  const [data,setData] = useState([]);

  useEffect(() => {
    for (let i=0;i<50;i++){
      fetch("https://jsonplaceholder.typicode.com/todos/"+i)
        .then(r=>r.json())
        .then(d=>{
          setData(prev=>[...prev,d])
        });
    }
  },[]);

  return (
    <div className="p-10">
      Loaded: {data.length}
    </div>
  );
}
```

Tests:

* async batching
* state race safety

---

# 9. Layout Thrashing

```ts
const box = document.createElement("div");
document.body.appendChild(box);

function thrash(){
  for(let i=0;i<5000;i++){
    box.style.width = Math.random()*500+"px";
    box.offsetHeight;
  }

  requestAnimationFrame(thrash);
}

thrash();
```

Tests:

* layout performance
* DOM stability

---

# 10. React + Canvas Hybrid (Most Important)

```tsx
import React, { useEffect } from "react";

export default function Hybrid() {

  useEffect(() => {
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");

    function draw() {
      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.fillStyle="red";
      ctx.fillRect(Math.random()*300,Math.random()*300,20,20);
      requestAnimationFrame(draw);
    }

    draw();
  },[]);

  return (
    <div>
      <canvas id="canvas" width="400" height="400"></canvas>
    </div>
  );
}
```

Tests:

* React lifecycle
* imperative bridge
* animation loops

---

