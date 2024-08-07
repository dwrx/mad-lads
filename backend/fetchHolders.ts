import fs from "fs";
require("dotenv").config();

const url = "https://mainnet.helius-rpc.com/?api-key=" + process.env.HELIUS_API_KEY;

type AssetsResponse = {
  result: {
    total: number;
    items: any[];
  };
};

export const getHolders = async () => {
  const start = Date.now();
  let page = 1;
  let assetList: any[] = [];

  while (page) {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "my-id",
        method: "getAssetsByGroup",
        params: {
          groupKey: "collection",
          groupValue: "J1S9H3QjnRtBbbuD4HjPV6RpRhwuk4zKbxsnCHuTgh9w",
          page: page,
          limit: 1000,
        },
      }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = (await response.json()) as AssetsResponse;
    assetList.push(
      ...data.result.items.map((item) => {
        return { mint: item.id, owner: item.ownership.owner };
      })
    );
    if (data.result.total !== 1000) {
      page = 0;
    } else {
      page++;
    }
  }
  console.log(`Fetched ${assetList.length} mints in ${Date.now() - start}ms.`);
  fs.writeFileSync("./holders.json", JSON.stringify(assetList));
  console.log("Saved results to ./holders.json");
};

if (require.main === module) {
  getHolders().catch((error) => {
    console.error("Error fetching assets:", error);
    process.exit(1);
  });
}
