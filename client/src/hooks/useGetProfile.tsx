import { useState, useEffect } from "react";

import { useAuthContext } from "@/hooks/useAuthContext";

export const useGetProfile = () => {
  const { user } = useAuthContext();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [userPublicKey, setUserPublicKey] = useState<string | null>(null);
  const [userPrivateKey, setUserPrivateKey] = useState<string | null>(null);

  const getProfile = async () => {
    if (!user || !user.token) return;

    setUserPrivateKey(null);
    setUserPublicKey(null);
    setIsLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/profile/`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      const json = await response.json();

      if (!response.ok) {
        setError(json.error || "Failed to fetch profile");
      } else {
        setUserPublicKey(json.user.public_key);
        setUserPrivateKey(json.user.private_key);
      }
    } catch (err) {
      console.log("Error fetching profile.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch the profile when user is present
  useEffect(() => {
    if (user && user.token) {
      getProfile();
    }
  }, [user]);

  return { isLoading, error, userPublicKey, userPrivateKey };
};
