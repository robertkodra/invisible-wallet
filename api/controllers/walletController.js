const axios = require("axios");

const sponsorTransaction = async (req, res) => {
  const { userAddress } = req.body;

  const headers = {
    "Content-Type": "application/json",
    "api-key": `${process.env.PAYMASTER_KEY}`,
  };

  const payload = {
    address: userAddress,
    campaign: "Invisible Wallet",
    freeTx: 1,
    protocol: "SNF",
    whitelistedCalls: [
      {
        contractAddress:
          "0x51fde0f43ddd951ab883d2736427a0c6fd96fe4d9b13f7c54cbfce8c1a5a325",
        entrypoint: "0x696e6372656173655f636f756e746572",
      },
    ],
  };

  try {
    console.log("before");
    const result = await axios.post(
      `https://sepolia.api.avnu.fi/paymaster/v1/accounts/${userAddress}/rewards`,
      payload,
      { headers }
    );
    console.log("after");
    if (result.status === 200) {
      return res
        .status(200)
        .json({ success: "Sponsoring transaction successful" });
    } else {
      return res.status(400).json({ error: "Sponsoring transaction failed" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error });
  }
};

module.exports = { sponsorTransaction };
