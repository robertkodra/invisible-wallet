// hooks/useCounter.ts
import { useState, useEffect } from "react";
import { getCounterValue } from "@/api/transactions";

export const useCounter = () => {
  const [counter, setCounter] = useState(0);

  useEffect(() => {
    const fetchCounter = async () => {
      const value = await getCounterValue();
      setCounter(value);
    };

    fetchCounter();
    const intervalId = setInterval(fetchCounter, 5000);

    return () => clearInterval(intervalId);
  }, []);

  return counter;
};
