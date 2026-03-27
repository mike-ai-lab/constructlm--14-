function useCounter() {
  const [count, setCount] = useState(0);

  return { count, setCount };
}

FILE: my-project/utils/helpers.js