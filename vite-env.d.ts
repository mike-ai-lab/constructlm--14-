/// <reference types="vite/client" />

// Declare worker module types for Vite
declare module '*?worker' {
  const workerConstructor: {
    new (): Worker;
  };
  export default workerConstructor;
}

// Declare worker URL module types
declare module '*?worker&url' {
  const src: string;
  export default src;
}

// Declare inline worker module types
declare module '*?worker&inline' {
  const workerConstructor: {
    new (): Worker;
  };
  export default workerConstructor;
}
