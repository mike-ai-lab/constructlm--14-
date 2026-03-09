The issue you're encountering, Muhamad, is a classic "Flexbox Minimum Size" conflict. Even with `min-w-0`, if a nested child (like your button group or a long string) has a fixed or intrinsic width that exceeds the parent's shrinking space, it will "push" the container out, causing that clipping behind the canvas.

To fix this, we need to enforce a **strict layout constraint** on the message wrapper and use **CSS Container Queries** (or `min-width: 0` on every nested level) to ensure the card collapses gracefully when the chat area hits that 480px mark.

I have updated the code to simulate your exact 35/65 split and applied the "deep-shrink" fixes to the React Component Card.

### Why your 420px container was clipping:

1. **Intrinsic Width Pushing**: Even if the parent has `max-w-[90%]`, Flexbox defaults `min-width` to `auto`. If the "Open Canvas" button has a long text with `whitespace-nowrap`, Flexbox refuses to shrink the card smaller than that button's text. This "pushes" the whole message container out of its 90% boundary.
2. **The Fix - `min-width: 0**`: In my updated file, I added a `.shrink-safe` class. You must apply `min-width: 0` to **every** nested flex parent from the chat area down to the card.
3. **The Fix - Container Queries**: I used `@container` logic. When the card drops below 380px (which happens in your 35% view), the buttons switch to a vertical stack. This prevents the horizontal "push" and allows the message to stay inside the 35% area.
4. **Padding Cumulative Effect**: In a 480px space, `p-6` (24px) on both sides takes 48px, leaving only 432px. If the card has inner padding too, the "content zone" is much smaller than you think.

Try the "Toggle 35/65 Split" button in the preview to see how the card intelligently collapses to prevent clipping, Muhamad. References: [Tailwind Responsive Design](https://tailwindcss.com/docs/responsive-design), [MDN Flexbox Min-Size](https://developer.mozilla.org/en-US/docs/Web/CSS/flex-shrink).

```html
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ConstructLM | Layout Debug & Fix</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          fontFamily: { sans: ['Plus Jakarta Sans', 'sans-serif'], mono: ['JetBrains Mono', 'monospace'] },
          colors: { brand: { blue: '#2563eb' }, surface: { 900: '#0A0A0B', 800: '#141417' } }
        }
      }
    }
  </script>
  <style>
    .sidebar-transition { transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
    .collapsed { width: 0 !important; opacity: 0; pointer-events: none; overflow: hidden; }
    
    /* THE FIX: Ensure all flex parents allow children to shrink to zero */
    .shrink-safe { min-width: 0; width: 100%; }
    
    /* Container Query for the Card itself */
    .card-container { container-type: inline-size; }
    
    @container (max-width: 380px) {
      .card-actions { flex-direction: column; width: 100%; }
      .card-actions button { width: 100%; justify-content: center; }
      .card-header { margin-bottom: 0.5rem; }
    }
  </style>
</head>
<body class="bg-white dark:bg-surface-900 text-slate-900 dark:text-slate-100 font-sans h-screen flex flex-col overflow-hidden">

  <header class="h-14 border-b border-slate-200 dark:border-white/5 px-4 flex items-center justify-between shrink-0 z-50">
    <div class="flex items-center gap-4">
      <div class="font-bold text-xs uppercase tracking-widest text-brand-blue">ConstructLM Debug</div>
      <button onclick="toggleCanvas()" class="px-3 py-1 bg-brand-blue/10 text-brand-blue rounded text-[10px] font-bold uppercase border border-brand-blue/20">
        Toggle 35/65 Split
      </button>
    </div>
  </header>

  <main class="flex-1 flex overflow-hidden">
    <!-- CHAT AREA (35% when canvas is open) -->
    <section id="chatArea" class="sidebar-transition flex flex-col bg-white dark:bg-surface-900 relative overflow-hidden border-r border-slate-200 dark:border-white/5 w-full">
      <div class="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 flex flex-col items-center">
        
        <!-- MESSAGE CONTAINER (max-w-[90%] when canvas open) -->
        <div id="messageWrapper" class="w-full space-y-6 max-w-3xl transition-all duration-300">
          
          <div class="p-4 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/10 shrink-safe">
            <p class="text-xs mb-4 opacity-70 italic">Muhamad, this card will now collapse its buttons and truncate its title when the 35% split is active.</p>
            
            <!-- REACT COMPONENT CARD -->
            <div class="card-container border border-slate-200 dark:border-white/10 p-2 my-4 flex flex-col md:flex-row md:items-center md:justify-between group hover:bg-slate-100 dark:hover:bg-white/10 transition-all rounded-lg max-w-full overflow-hidden min-w-0">
              
              <!-- Left Side: Info -->
              <div class="card-header flex items-center gap-2 min-w-0 flex-1 mb-2 md:mb-0">
                <div class="border border-slate-200 dark:border-white/10 p-1.5 bg-brand-blue text-white rounded shrink-0">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" stroke-width="2"/></svg>
                </div>
                <div class="min-w-0 flex-1">
                  <h4 class="text-xs font-bold uppercase tracking-tight truncate">React Component</h4>
                  <p class="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase truncate">Typescript • Ready to render</p>
                </div>
              </div>

              <!-- Right Side: Actions (The part that usually causes clipping) -->
              <div class="card-actions flex gap-1 shrink-0 justify-end">
                <button class="p-2 border border-slate-200 dark:border-white/10 bg-white dark:bg-surface-800 rounded hover:bg-slate-50">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" stroke-width="2"/></svg>
                </button>
                <button class="border border-brand-blue px-3 py-1.5 text-[10px] font-black uppercase bg-white dark:bg-surface-800 hover:bg-brand-blue hover:text-white transition-all flex items-center gap-2 rounded whitespace-nowrap">
                  Open Canvas
                </button>
              </div>
            </div>

            <p class="text-xs opacity-60">Regular text wraps normally, which is why your other messages weren't clipping. The "Open Canvas" button has <code>whitespace-nowrap</code>, which was acting as a solid "bar" pushing the container out.</p>
          </div>

        </div>
      </div>
    </section>

    <!-- CANVAS AREA (65%) -->
    <section id="canvasArea" class="sidebar-transition w-0 opacity-0 overflow-hidden bg-slate-50 dark:bg-surface-800 flex flex-col border-l border-slate-200 dark:border-white/5">
        <div class="p-4 border-b border-slate-200 dark:border-white/5 text-[10px] font-bold uppercase tracking-widest opacity-50">Canvas View (65%)</div>
        <div class="flex-1 flex items-center justify-center p-10">
            <div class="w-full h-full border-2 border-dashed border-slate-300 dark:border-white/10 rounded-2xl flex items-center justify-center">
                <p class="text-xs font-mono opacity-30">Render Space</p>
            </div>
        </div>
    </section>
  </main>

  <script>
    let canvasOpen = false;
    const chatArea = document.getElementById('chatArea');
    const canvasArea = document.getElementById('canvasArea');
    const messageWrapper = document.getElementById('messageWrapper');

    function toggleCanvas() {
        canvasOpen = !canvasOpen;
        if (canvasOpen) {
            chatArea.style.width = '35%';
            canvasArea.style.width = '65%';
            canvasArea.classList.remove('opacity-0');
            messageWrapper.classList.replace('max-w-3xl', 'max-w-[90%]');
        } else {
            chatArea.style.width = '100%';
            canvasArea.style.width = '0';
            canvasArea.classList.add('opacity-0');
            messageWrapper.classList.replace('max-w-[90%]', 'max-w-3xl');
        }
    }
  </script>
</body>
</html>
```