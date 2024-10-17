import { useState } from "react";
import { useAuthContext } from "./useAuthContext";

export const useSignup = () => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { dispatch } = useAuthContext();

  const signup = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/user/signup`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
      );

      const json = await response.json();

      if (!response.ok) {
        setError(json.error);
        return null; // Return null if signup failed
      } else {
        localStorage.setItem("user", JSON.stringify(json));
        dispatch({ type: "LOGIN", payload: json });
        return json; // Return user data if signup succeeded
      }
    } catch (err) {
      setError("An error occurred during signup");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { signup, isLoading, error };
};
