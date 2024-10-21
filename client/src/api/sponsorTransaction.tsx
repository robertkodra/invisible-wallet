import {
  fetchAccountsRewards,
  GaslessOptions,
  SEPOLIA_BASE_URL,
} from "@avnu/gasless-sdk";

const options: GaslessOptions = {
  baseUrl: SEPOLIA_BASE_URL,
};

/**
 * Sets up sponsored transactions for a user
 * @param userAddress - The user's wallet address
 * @param userToken - The user's authentication token
 * @returns The current counter value, or 0 if an error occurs
 */
export const setSponsoredTransactions = async (
  userAddress: string,
  userToken: string
): Promise<boolean> => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/wallet/sponsor`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ userAddress }),
      }
    );
    if (response.status === 200) {
      console.log("Sponsoring transaction successful!");
      return true;
    } else {
      console.error("Failed to sponsor transaction:", await response.text());
      return false;
    }
  } catch (error: any) {
    console.error("Error setting up sponsored transactions:", error);
    return false;
  }
};

/**
 * Retrieves the number of remaining sponsored transactions for a user.
 * @param userAddress - The user's wallet address
 * @returns A promise that resolves to the number of remaining transactions
 */
export const getSponsoredTransactions = async (
  userAddress: string
): Promise<number> => {
  try {
    const response = await fetchAccountsRewards(userAddress, options);

    if (Array.isArray(response) && response.length > 0) {
      const totalRemainingTx = response.reduce((sum, item) => {
        return sum + (item.remainingTx || 0);
      }, 0);

      console.log("Total Remaining Transactions:", totalRemainingTx);
      return totalRemainingTx;
    } else {
      console.log("No sponsored transactions available or empty response.");
      return 0; // Return 0 if there are no sponsored transactions
    }
  } catch (error: any) {
    console.error("Error fetching sponsored transactions:", error);
    return 0;
  }
};
