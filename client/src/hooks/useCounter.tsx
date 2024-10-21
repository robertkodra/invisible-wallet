import { useState, useEffect } from "react";

import { getCounterValue } from "@/api/transactions";

export const useCounter = (userAddress: string) => {
  const [counter, setCounter] = useState(0);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const fetchCounter = async () => {
      if (userAddress) {
        const value = await getCounterValue(userAddress);
        setCounter(value);
      }
    };

    fetchCounter();
    intervalId = setInterval(fetchCounter, 1000);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [userAddress]);

  return counter;
};
