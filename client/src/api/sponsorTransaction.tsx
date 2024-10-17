import {
  fetchAccountsRewards,
  GaslessOptions,
  SEPOLIA_BASE_URL,
} from "@avnu/gasless-sdk";

const setSponsoredTransactions = async (
  userAddress: string,
  userToken: string
) => {
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
    } else {
      console.log(JSON.stringify(response));
    }
  } catch (error: any) {
    console.log(error);
  }
};

const options: GaslessOptions = {
  baseUrl: SEPOLIA_BASE_URL,
};
const getSponsoredTransactions = async (userAddress: string) => {
  try {
    const response = await fetchAccountsRewards(userAddress, options);

    if (response && Array.isArray(response) && response.length > 0) {
      const totalRemainingTx = response.reduce((sum, item) => {
        return sum + (item.remainingTx || 0);
      }, 0);

      console.log("Total Remaining Transactions:", totalRemainingTx);
      return totalRemainingTx;
    } else {
      console.log("No sponsored transactions available or empty response.");
      return 0; // Return 0 if no transactions
    }
  } catch (error: any) {
    console.log("Error fetching sponsored transactions:", error);
    return 0; // Return 0 in case of an error
  }
};
export { setSponsoredTransactions, getSponsoredTransactions };
