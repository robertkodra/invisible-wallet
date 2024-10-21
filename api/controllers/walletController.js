const axios = require("axios");

const sponsorTransaction = async (req, res) => {
  const { userAddress } = req.body;

  const headers = {
    "Content-Type": "application/json",
    "api-key": process.env.PAYMASTER_KEY,
  };

  const payload = {
    address: userAddress,
    campaign: "Invisible Wallet",
    freeTx: 1,
    protocol: "SNF",
    whitelistedCalls: [
      {
        contractAddress: process.env.CONTRACT_ADDRESS,
        entrypoint: process.env.CONTRACT_ENTRY_POINT, // hex format needed as per AVNU's docs
      },
    ],
  };

  try {
    const result = await axios.post(
      `${PAYMASTER_URL}/paymaster/v1/accounts/${userAddress}/rewards`,
      payload,
      { headers }
    );

    if (response.status === 200) {
      return res
        .status(200)
        .json({ success: true, message: "Sponsoring transaction successful" });
    } else {
      return res
        .status(400)
        .json({ success: false, error: "Sponsoring transaction failed" });
    }
  } catch (error) {
    console.error(
      "Error in sponsorTransaction:",
      error.response?.data || error.message
    );
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = { sponsorTransaction };
