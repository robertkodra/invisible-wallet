import { useState, useEffect } from "react";
import { toast } from "react-toastify";

import Layout from "@/layout/Layout";
import { Meta } from "@/layout/Meta";
import { createArgentWallet, createBraavosWallet } from "@/api/wallet";
import { invokeContract } from "@/api/transactions";
import Modal from "@/components/Modal";
import ActionButton from "@/components/ActionButton";
import Section from "@/components/Section";
import { useAuthContext } from "@/hooks/useAuthContext";
import { useCounter } from "@/hooks/useCounter";
import { useModal } from "@/hooks/useModal";
import { AppConfig } from "@/utils/AppConfig";
import { useGetProfile } from "@/hooks/useGetProfile";

export default function Index() {
  const { user, dispatch } = useAuthContext();
  const { isOpen, openModal, closeModal } = useModal();
  const { argentPublicKey, isLoading: profileLoading } = useGetProfile();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userAddress, setUserAddress] = useState<{
    argent: string | null;
    braavos: string | null;
  }>({ argent: null, braavos: null });
  const argentCounter = useCounter(userAddress.argent);
  const braavosCounter = useCounter(userAddress.braavos);
  const [modalAction, setModalAction] = useState<{
    type: "deploy" | "increase";
    wallet: "argent" | "braavos";
  }>({ type: "deploy", wallet: "argent" });

  useEffect(() => {
    if (user) {
      setUserAddress({
        argent: user.argent_account || null, // Changed from argent_public_key
        braavos: user.braavos_account || null, // Changed from braavos_public_key
      });
    }
  }, [user]);
  const getExplorerUrl = (transactionHash: string) => {
    return `${process.env.NEXT_PUBLIC_STARKSCAN_URL}/tx/${transactionHash}`;
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

  const handleDeployWallet = (wallet: "argent" | "braavos") => {
    if (!user) {
      toast.error("Please log in to deploy a wallet.");
      return;
    }

    const hasWallet =
      wallet === "argent" ? user.argent_account : user.braavos_account;

    if (hasWallet) {
      toast.info(`${wallet} wallet is already deployed.`);
      return;
    }

    setModalAction({ type: "deploy", wallet });
    openModal();
  };

  const handleCounterContract = async (wallet: "argent" | "braavos") => {
    if (!user) {
      toast.error("Please log in to increase the counter.");
      return;
    }

    const walletAddress = wallet === "argent" ? argentPublicKey : null;
    const hasValidSession = user.session?.wallet === wallet && 
      Date.now() < user.session.expiry;

    console.log("Transaction check:", {
      walletAddress,
      hasValidSession,
      wallet,
      sessionWallet: user.session?.wallet,
      argentPublicKey
    });

    if (!walletAddress && !hasValidSession) {
      toast.error(`Please deploy a ${wallet} wallet first.`);
      return;
    }

    setIsLoading(true);
    try {
      const result = await invokeContract(
        walletAddress!,
        user.token,
        hasValidSession ? null : undefined,
        wallet
      );
      
      if (result) {
        showWalletDeployedToast(result, "Counter increased successfully!");
      } else {
        toast.error("Failed to increase counter. Please try again.");
      }
    } catch (error) {
      console.error("Error increasing counter:", error);
      toast.error("Failed to increase counter. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleModalSubmit = async (password: string) => {
    setIsLoading(true);
    setError("");
    try {
      if (modalAction.type === "deploy") {
        const hasWallet =
          modalAction.wallet === "argent"
            ? user.argent_account
            : user.braavos_account;

        if (!hasWallet) {
          const createWalletFn =
            modalAction.wallet === "argent"
              ? createArgentWallet
              : createBraavosWallet;

          const result = await createWalletFn(user.token, dispatch, password);

          if (result?.success) {
            // Added optional chaining
            showWalletDeployedToast(
              result.data!,
              `${modalAction.wallet.charAt(0).toUpperCase() + modalAction.wallet.slice(1)} wallet deployed successfully!`
            );
          } else {
            toast.error(
              result?.error || "Failed to deploy wallet. Please try again." // Added optional chaining
            );
          }
        } else {
          toast.info(`${modalAction.wallet} wallet is already deployed.`);
        }
      } else if (modalAction.type === "increase") {
        const publicKey =
          modalAction.wallet === "argent"
            ? user.argent_account
            : user.braavos_account;

        if (publicKey && user.token) {
          const result = await invokeContract(
            publicKey,
            user.token,
            password,
            modalAction.wallet
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
        `Error ${modalAction.type === "deploy" ? "deploying wallet" : "increasing counter"}:`,
        error
      );
      setError(
        `Failed to ${modalAction.type === "deploy" ? "deploy wallet" : "increase counter"}. Please try again.`
      );
      toast.error(
        `Failed to ${modalAction.type === "deploy" ? "deploy wallet" : "increase counter"}. Please try again.`
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
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
              enim ad minim veniam, quis nostrud exercitation ullamco laboris
              nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in
              reprehenderit in voluptate velit esse cillum dolore eu fugiat
              nulla pariatur. Excepteur sint occaecat cupidatat non proident,
              sunt in culpa qui officia deserunt mollit anim id est laborum.
            </p>
          </div>
        </Section>
        <Section yPadding="py-20" className="bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Invisible Argent Account */}
              <div className="flex-1 bg-gray-100 rounded-lg shadow-xl p-8">
                <h2 className="text-2xl font-bold text-center mb-4 text-blue-600">
                  Invisible Argent Account
                </h2>
                <p className="text-gray-600 mb-6 text-center h-20">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
                  do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                </p>
                <div className="space-y-6">
                  <div className="flex justify-center">
                    <ActionButton
                      onClick={() => handleDeployWallet("argent")}
                      isDisabled={!user || !!user.argent_account}
                      isLoading={
                        isLoading &&
                        modalAction.type === "deploy" &&
                        modalAction.wallet === "argent"
                      }
                      text={"Deploy Wallet"}
                      loadingText="Deploying..."
                      color="blue"
                      className="w-full max-w-xs"
                    />
                  </div>
                  <div className="flex justify-center">
                    <ActionButton
                      onClick={() => handleCounterContract("argent")}
                      isDisabled={!user || (!argentPublicKey && !user.session)}
                      isLoading={isLoading || profileLoading}
                      text={"Increase Counter"}
                      loadingText="Increasing..."
                      color="argent"
                      className="w-full max-w-xs"
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Counter Value:
                    </p>
                    <span className="text-2xl font-bold text-blue-600">
                      {argentCounter}
                    </span>
                  </div>
                </div>
              </div>

              {/* Invisible Braavos Account */}
              <div className="flex-1 bg-gray-100 rounded-lg shadow-xl p-8">
                <h2 className="text-2xl font-bold text-center mb-4 text-blue-600">
                  Invisible Braavos Account
                </h2>
                <p className="text-gray-600 mb-6 text-center h-20">
                  Ut enim ad minim veniam, quis nostrud exercitation ullamco
                  laboris nisi ut aliquip ex ea commodo consequat.
                </p>
                <div className="space-y-6">
                  <div className="flex justify-center">
                    <ActionButton
                      onClick={() => handleDeployWallet("braavos")}
                      isDisabled={!user || !!user.braavos_account}
                      // isDisabled={true}
                      isLoading={
                        isLoading &&
                        modalAction.type === "deploy" &&
                        modalAction.wallet === "braavos"
                      }
                      text={"Deploy Wallet"}
                      loadingText="Deploying..."
                      color="blue"
                      className="w-full max-w-xs"
                    />
                  </div>
                  <div className="flex justify-center">
                    <ActionButton
                      onClick={() => handleCounterContract("braavos")}
                      isDisabled={!user || !user.braavos_account}
                      isLoading={
                        isLoading &&
                        modalAction.type === "increase" &&
                        modalAction.wallet === "braavos"
                      }
                      text={"Increase Counter"}
                      loadingText="Increasing..."
                      color="braavos"
                      className="w-full max-w-xs"
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Counter Value:
                    </p>
                    <span className="text-2xl font-bold text-blue-600">0</span>{" "}
                    {braavosCounter}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {error && (
            <p className="mt-4 text-red-500 text-center text-sm">{error}</p>
          )}
        </Section>

        <Section yPadding="py-20">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8 text-blue-600">
              Powered by
            </h2>
            <div className="flex justify-center items-center space-x-12">
              <div className="transform transition-transform duration-300 hover:scale-105">
                <img
                  src="/img/avnu_v1.png"
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
              <div className="transform transition-transform duration-300 hover:scale-105">
                <img
                  src="/img/argent.png"
                  alt="Argent"
                  className="h-24 object-contain"
                />
              </div>
              <div className="transform transition-transform duration-300 hover:scale-105">
                <img
                  src="/img/braavos.png"
                  alt="Braavos"
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
