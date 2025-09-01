import React, { useEffect, useState } from "react";
import { useWeb3 } from "../../hooks/useWeb3"; 
import { useProofMint } from "../../hooks/useProofMint";
import { Gadget } from "../../utils/types";

const BuyerDashboard = () => {
  const { connect, account, isConnected, web3Error } = useWeb3();
  const { getUserReceipts, purchaseGadget, requestRecycling } = useProofMint();
  const [gadgets, setGadgets] = useState<Gadget[]>([]);
  const [tokenId, setTokenId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGadgets = async () => {
      if (!account || !isConnected) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Fetch available gadgets (mocked for now; adjust based on ProofMint contract)
        const receipts = await getUserReceipts(account);
        const gadgetList: Gadget[] = receipts
          .filter((receipt) => !receipt.status) // Assuming status 0 means available
          .map((receipt, index) => ({
            id: index,
            name: receipt.name || `Gadget #${index}`, // Adjust based on receipt structure
            price: "0.1", // Placeholder; replace with actual price
            seller: receipt.merchant,
            sold: false,
          }));
        setGadgets(gadgetList);
      } catch (error) {
        console.error("Error fetching gadgets:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGadgets();
  }, [account, isConnected]);

  const handlePurchaseGadget = async (gadgetId: number, price: string) => {
    if (!account || !isConnected) {
      alert("Please connect your wallet first.");
      return;
    }

    try {
      await purchaseGadget(gadgetId, ethers.parseEther(price)); // Adjust parameters based on contract
      alert("Purchase successful!");
      setGadgets(gadgets.filter((g) => g.id !== gadgetId));
    } catch (err) {
      console.error("Error purchasing gadget:", err);
      alert("Error purchasing gadget");
    }
  };

  const handleRequestRecycling = async () => {
    if (!account || !isConnected) {
      alert("Please connect your wallet first.");
      return;
    }

    if (!tokenId) {
      alert("Please enter a valid NFT Token ID.");
      return;
    }

    try {
      await requestRecycling(parseInt(tokenId));
      alert(`Recycling requested for NFT #${tokenId}`);
      setTokenId("");
    } catch (err) {
      console.error("Error requesting recycling:", err);
      alert("Error requesting recycling");
    }
  };

  if (loading) return <div className="p-6">Loading dashboard...</div>;
  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">Welcome to ProofMint</h1>
        <p className="mb-6">Connect your wallet to get started</p>
        <button
          onClick={connect}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Connect Wallet
        </button>
        {web3Error && <p className="mt-4 text-red-500">{web3Error}</p>}
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Buyer Dashboard</h2>
      <p>Connected: {account || "Not connected"}</p>
      <div className="mt-4">
        <h3 className="text-lg">Available Gadgets</h3>
        {gadgets.length === 0 ? (
          <p>No gadgets available.</p>
        ) : (
          gadgets.map((gadget) => (
            <div key={gadget.id} className="flex justify-between border-b py-2">
              <span>
                {gadget.name} - {gadget.price} ETH
              </span>
              <button
                onClick={() => handlePurchaseGadget(gadget.id, gadget.price)}
                className="bg-green-500 text-white px-4 py-1 rounded hover:bg-green-600"
                disabled={!isConnected}
              >
                Buy
              </button>
            </div>
          ))
        )}
      </div>
      <div className="mt-4">
        <h3 className="text-lg">Request Recycling</h3>
        <input
          type="text"
          placeholder="NFT Token ID"
          value={tokenId}
          onChange={(e) => setTokenId(e.target.value)}
          className="border p-2 mr-2 w-32"
          disabled={!isConnected}
        />
        <button
          onClick={handleRequestRecycling}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          disabled={!isConnected}
        >
          Request
        </button>
      </div>
    </div>
  );
};

export default BuyerDashboard;