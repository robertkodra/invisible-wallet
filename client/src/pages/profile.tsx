import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { toast } from "react-toastify";

import { useAuthContext } from "@/hooks/useAuthContext";
import { useGetProfile } from "@/hooks/useGetProfile";
import { useModal } from "@/hooks/useModal";
import Modal from "@/components/Modal";
import { decryptPrivateKey } from "@/utils/encryption";
import Layout from "@/layout/Layout";
import ActionButton from "@/components/ActionButton";

const LOADING_TEXT = "Loading...";
const NO_KEY_FOUND = "No key found";
const HIDDEN_KEY = "••••••••";

interface WalletKeys {
  publicKey: string;
  privateKey: string;
}

interface ProfileInfoProps {
  label: string;
  value: string;
  isLoading: boolean;
}

const ProfileInfo: React.FC<ProfileInfoProps> = ({
  label,
  value,
  isLoading,
}) => (
  <div>
    <label className="block text-sm font-medium mb-1 text-gray-700">
      {label}:
    </label>
    <p className="text-gray-600 bg-gray-100 p-2 rounded-md truncate">
      {isLoading ? LOADING_TEXT : value}
    </p>
  </div>
);

const Profile: React.FC = () => {
  const { user } = useAuthContext();
  const router = useRouter();
  const { isLoading, error, userPublicKey, userPrivateKey } = useGetProfile();
  const { isOpen, openModal, closeModal } = useModal();
  const [selectedWallet, setSelectedWallet] = useState<
    "argent" | "braavos" | null
  >(null);
  const [argentKeys, setArgentKeys] = useState<WalletKeys>({
    publicKey: "",
    privateKey: "",
  });
  const [braavosKeys, setBraavosKeys] = useState<WalletKeys>({
    publicKey: "",
    privateKey: "",
  });

  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  useEffect(() => {
    if (!isLoading) {
      setArgentKeys({
        publicKey: userPublicKey || "",
        privateKey: userPrivateKey || "",
      });
      setBraavosKeys({
        publicKey: "", // TODO: add Braavos when lvie
        privateKey: "",
      });
    }
  }, [isLoading, userPublicKey, userPrivateKey]);

  const handleCopyPrivateKey = (wallet: "argent" | "braavos") => {
    setSelectedWallet(wallet);
    openModal();
  };

  const handleModalSubmit = async (password: string) => {
    if (!password) {
      toast.error("Please enter a password.");
      return;
    }

    const privateKey =
      selectedWallet === "argent"
        ? argentKeys.privateKey
        : braavosKeys.privateKey;

    if (!privateKey) {
      toast.error("You need to deploy a wallet first!");
      return;
    }

    const privateKeyDecrypted = decryptPrivateKey(privateKey, password);
    if (privateKeyDecrypted) {
      try {
        await navigator.clipboard.writeText(privateKeyDecrypted);
        toast.success(
          `${selectedWallet.charAt(0).toUpperCase() + selectedWallet.slice(1)} private key copied to clipboard!`
        );
        closeModal();
      } catch (err) {
        toast.error("Failed to copy to clipboard. Please try again.");
      }
    } else {
      toast.error("Incorrect password. Please try again.");
    }
  };

  if (!user) return null;

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
              <h2 className="text-2xl font-bold mb-8 text-blue-600">
                User Profile
              </h2>
              <ProfileInfo
                label="Email"
                value={user.email}
                isLoading={isLoading}
              />
            </div>

            {/* Argent Wallet Section */}
            <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
              <h2 className="text-2xl font-bold mb-4 text-[#ff7b53]">
                Argent Wallet
              </h2>
              <div className="space-y-4">
                <ProfileInfo
                  label="Public Key"
                  value={argentKeys.publicKey || NO_KEY_FOUND}
                  isLoading={isLoading}
                />
                <ProfileInfo
                  label="Private Key"
                  value={argentKeys.privateKey ? HIDDEN_KEY : NO_KEY_FOUND}
                  isLoading={isLoading}
                />
                <ActionButton
                  onClick={() => handleCopyPrivateKey("argent")}
                  isDisabled={!argentKeys.privateKey || isLoading}
                  isLoading={isLoading}
                  text="Copy Private Key"
                  loadingText="Loading..."
                  color="blue"
                  className="w-full"
                />
              </div>
            </div>

            {/* Braavos Wallet Section */}
            <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
              <h2 className="text-2xl font-bold mb-4 text-[#ffa100]">
                Braavos Wallet
              </h2>
              <div className="space-y-4">
                <ProfileInfo
                  label="Public Key"
                  value={braavosKeys.publicKey || NO_KEY_FOUND}
                  isLoading={isLoading}
                />
                <ProfileInfo
                  label="Private Key"
                  value={braavosKeys.privateKey ? HIDDEN_KEY : NO_KEY_FOUND}
                  isLoading={isLoading}
                />
                <ActionButton
                  onClick={() => handleCopyPrivateKey("braavos")}
                  isDisabled={!braavosKeys.privateKey || isLoading}
                  isLoading={isLoading}
                  text="Copy Private Key"
                  loadingText="Loading..."
                  color="blue"
                  className="w-full"
                />
              </div>
            </div>
          </div>
          {error && (
            <div className="mt-4 bg-red-100 border border-red-400 text-red-700 p-3 rounded-md text-sm max-w-3xl mx-auto">
              {error}
            </div>
          )}
        </div>
      </div>
      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        onSubmit={handleModalSubmit}
        title={`Enter Password to Copy ${selectedWallet?.charAt(0).toUpperCase() + selectedWallet?.slice(1)} Private Key`}
        isLoading={false}
      />
    </Layout>
  );
};

export default Profile;
