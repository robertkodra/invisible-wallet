import { useAuthContext } from "@/hooks/useAuthContext";
import { useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "@/layout/Layout";
import { useGetProfile } from "@/hooks/useGetProfile";
import { toast } from "react-toastify";
import Modal from "@/components/Modal";
import { decryptPrivateKey } from "@/utils/encryption";
import { useModal } from "@/hooks/useModal";

const LOADING_TEXT = "Loading...";
const NO_KEY_FOUND = "No key found";
const HIDDEN_KEY = "••••••••";

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

const CopyButton: React.FC<{
  onClick: () => void;
  disabled: boolean;
  isLoading: boolean;
}> = ({ onClick, disabled, isLoading }) => (
  <button
    onClick={onClick}
    className="w-full bg-blue-600 text-white py-2 px-4 rounded-full hover:bg-blue-700 transition duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
    disabled={disabled}
  >
    {isLoading ? LOADING_TEXT : "Copy Private Key"}
  </button>
);

const Profile: React.FC = () => {
  const { user } = useAuthContext();
  const router = useRouter();
  const { isLoading, error, userPublicKey, userPrivateKey } = useGetProfile();
  const { isOpen, openModal, closeModal } = useModal();

  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  const handleModalSubmit = async (password: string) => {
    if (!password) {
      toast.error("Please enter a password.");
      return;
    }

    if (!userPrivateKey) {
      toast.error("You need to deploy a wallet first!");
      return;
    }

    const privateKeyDecrypted = decryptPrivateKey(userPrivateKey, password);
    if (privateKeyDecrypted) {
      try {
        await navigator.clipboard.writeText(privateKeyDecrypted);
        toast.success("Private key copied to clipboard!");
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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <h1 className="text-3xl font-bold text-center mb-6 text-blue-600">
            User Profile
          </h1>
          <div className="space-y-4">
            <ProfileInfo
              label="Email"
              value={user.email}
              isLoading={isLoading}
            />
            <ProfileInfo
              label="Public Key"
              value={userPublicKey || NO_KEY_FOUND}
              isLoading={isLoading}
            />
            <ProfileInfo
              label="Private Key"
              value={userPrivateKey ? HIDDEN_KEY : NO_KEY_FOUND}
              isLoading={isLoading}
            />
            <CopyButton
              onClick={openModal}
              disabled={!userPrivateKey || isLoading}
              isLoading={isLoading}
            />
          </div>
          {error && (
            <div className="mt-4 bg-red-100 border border-red-400 text-red-700 p-3 rounded-md text-sm">
              {error}
            </div>
          )}
        </div>
      </div>
      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        onSubmit={handleModalSubmit}
        title="Enter Password to Copy Private Key"
        isLoading={false}
      />
    </Layout>
  );
};

export default Profile;
