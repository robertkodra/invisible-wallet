// General
import { useState } from "react";
import { toast } from "react-toastify";
// Layout
import Layout from "@/layout/Layout";
import { Meta } from "@/layout/Meta";
// API
import { createWallet } from "@/api/wallet";
import { invokeContract } from "@/api/transactions";
// Components
import Modal from "@/components/Modal";
import ActionButton from "@/components/ActionButton";
import Section from "@/components/Section";
// Hooks
import { useAuthContext } from "@/hooks/useAuthContext";
import { useCounter } from "@/hooks/useCounter";
import { useModal } from "@/hooks/useModal";
// Utils
import { AppConfig } from "@/utils/AppConfig";

export default function Index() {
  const { user, dispatch } = useAuthContext();
  const counter = useCounter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { isOpen, openModal, closeModal } = useModal();
  const [modalAction, setModalAction] = useState<"deploy" | "increase">(
    "deploy"
  );

  const getExplorerUrl = (transactionHash: string) => {
    return `https://sepolia.starkscan.co//tx/${transactionHash}`;
  };

  const showWalletDeployedToast = (
    transactionHash: string,
    message: string
  ) => {
    toast(
      <div>
        {message}{" "}
        <a
          href={getExplorerUrl(transactionHash)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 underline hover:text-blue-700"
        >
          View transaction
        </a>
      </div>,
      {
        type: "success",
        closeOnClick: false,
        autoClose: 3000,
      }
    );
  };

  const handleDeployWallet = () => {
    if (!user) {
      toast.error("Please log in to deploy a wallet.");
      return;
    }

    if (user.public_key) {
      toast.info("Wallet is already deployed.");
      return;
    }

    setModalAction("deploy");
    openModal();
  };

  const handleCounterContract = () => {
    if (!user) {
      toast.error("Please log in to increase the counter.");
      return;
    }

    if (!user.public_key) {
      toast.error("Please deploy a wallet first.");
      return;
    }

    setModalAction("increase");
    openModal();
  };

  const handleModalSubmit = async (password: string) => {
    setIsLoading(true);
    setError("");
    try {
      if (modalAction === "deploy") {
        if (!user.public_key) {
          const result = await createWallet(user.token, dispatch, password);
          if (result) {
            showWalletDeployedToast(result, "Wallet deployed successfully!");
          } else {
            toast.error("Failed to deploy wallet. Please try again.");
          }
        } else {
          toast.info("Wallet is already deployed.");
        }
      } else if (modalAction === "increase") {
        if (user?.public_key && user.token) {
          const result = await invokeContract(
            user.public_key,
            user.token,
            password
          );
          if (result) {
            showWalletDeployedToast(result, "Counter increased successfully!");
          } else {
            toast.error("Failed to increase counter. Please try again.");
          }
        }
      }
    } catch (error) {
      console.error(
        `Error ${modalAction === "deploy" ? "deploying wallet" : "increasing counter"}:`,
        error
      );
      setError(
        `Failed to ${modalAction === "deploy" ? "deploy wallet" : "increase counter"}. Please try again.`
      );
      toast.error(
        `Failed to ${modalAction === "deploy" ? "deploy wallet" : "increase counter"}. Please try again.`
      );
    } finally {
      setIsLoading(false);
      closeModal();
    }
  };

  return (
    <Layout>
      <Meta title={AppConfig.title} description={AppConfig.description} />
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 min-h-screen">
        <Section yPadding="py-20">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-center mb-6 text-blue-600 relative group">
              <span className="transition-opacity duration-300 group-hover:opacity-0">
                Invisible Wallet
              </span>
              <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100"></span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Experience the future of digital asset management with Invisible
              Wallet. Our innovative solution provides a secure, user-friendly
              interface for interacting with blockchain technology on the
              Starknet network.
            </p>
          </div>
        </Section>

        <Section yPadding="py-20" className="bg-white">
          <div className="max-w-md mx-auto bg-gray-100 rounded-lg shadow-xl p-8">
            <h2 className="text-2xl font-bold text-center mb-6 text-blue-600">
              Invisible Argent Account
            </h2>
            <div className="flex flex-col space-y-6">
              <ActionButton
                onClick={handleDeployWallet}
                isDisabled={!user || !!user.public_key}
                isLoading={isLoading && modalAction === "deploy"}
                text={
                  !user
                    ? "Login to Deploy Wallet"
                    : user.public_key
                      ? "Wallet Deployed"
                      : "Deploy Wallet"
                }
                loadingText="Deploying..."
                color="blue"
              />
              <ActionButton
                onClick={handleCounterContract}
                isDisabled={!user || !user.public_key}
                isLoading={isLoading && modalAction === "increase"}
                text={
                  !user
                    ? "Login to Increase Counter"
                    : !user.public_key
                      ? "Deploy Wallet First"
                      : "Increase Counter"
                }
                loadingText="Increasing..."
                color="green"
              />
              <div className="rounded-lg p-4 text-center">
                <p className="text-lg font-semibold text-gray-700">
                  Counter: {counter}
                </p>
              </div>
            </div>
            {error && (
              <p className="mt-4 text-red-500 text-center text-sm">{error}</p>
            )}
          </div>
        </Section>

        <Section yPadding="py-20">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8 text-blue-600">
              Future Developments
            </h2>
            <ul className="space-y-4 text-gray-600">
              <li className="flex items-start">
                <img
                  src="/checkmark.svg"
                  alt="Checkmark"
                  className="w-4 h-4 mr-2 mt-1 svg-green "
                />
                <span>
                  Integration with Braavos accounts for enhanced
                  interoperability.
                </span>
              </li>
              <li className="flex items-start">
                <img
                  src="/checkmark.svg"
                  alt="Checkmark"
                  className="w-4 h-4 mr-2 mt-1 svg-green"
                />
                <span>
                  Integration with passkeys for encrypt the private key of the
                  user.
                </span>
              </li>
              <li className="flex items-start">
                <img
                  src="/checkmark.svg"
                  alt="Checkmark"
                  className="w-4 h-4 mr-2 mt-1 svg-green"
                />
                <span>and more</span>
              </li>
            </ul>
          </div>
        </Section>

        <Section yPadding="py-20">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8 text-blue-600">
              Powered by
            </h2>
            <div className="flex justify-center items-center space-x-12">
              <div className="transform transition-transform duration-300 hover:scale-105">
                <img
                  src="/img/avnu.png"
                  alt="Avnu"
                  className="h-24 object-contain"
                />
              </div>
              <div className="transform transition-transform duration-300 hover:scale-105">
                <img
                  src="/img/starknet-js.png"
                  alt="Starknet.js"
                  className="h-24 object-contain"
                />
              </div>
            </div>
          </div>
        </Section>

        <Modal
          isOpen={isOpen}
          onClose={closeModal}
          onSubmit={handleModalSubmit}
          title={
            modalAction === "deploy" ? "Deploy Wallet" : "Increase Counter"
          }
          isLoading={isLoading}
        />
      </div>
    </Layout>
  );
}
