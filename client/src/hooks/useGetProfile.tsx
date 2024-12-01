import { useState, useEffect } from "react";

import { useAuthContext } from "@/hooks/useAuthContext";

export const useGetProfile = () => {
  const { user } = useAuthContext();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [argentPublicKey, setArgentPublicKey] = useState<string | null>(null);
  const [argentPrivateKey, setArgentPrivateKey] = useState<string | null>(null);
  const [braavosPublicKey, setBraavosPublicKey] = useState<string | null>(null);
  const [braavosPrivateKey, setBraavosPrivateKey] = useState<string | null>(
    null
  );

  const getProfile = async () => {
    if (!user || !user.token) return;

    setArgentPublicKey(null);
    setArgentPrivateKey(null);
    setBraavosPublicKey(null);
    setBraavosPrivateKey(null);
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
        setArgentPublicKey(json.user.argent_public_key);
        setArgentPrivateKey(json.user.argent_private_key);
        setBraavosPublicKey(json.user.braavos_public_key);
        setBraavosPrivateKey(json.user.braavos_private_key);
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

  return {
    isLoading,
    error,
    argentPublicKey,
    argentPrivateKey,
    braavosPublicKey,
    braavosPrivateKey,
  };
};
