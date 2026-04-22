import { useState } from "react";
import { useWallet } from "../context/WalletContext";
import { Contract, parseEther } from "ethers";

const CONTRACT_ADDRESS = "0x..."; // Will be updated after deployment
const CONTRACT_ABI = [
  "function createProject(address contractor, string title, string description, uint256 budget, uint256 vetoThreshold) payable returns (uint256)",
  "function submitProof(uint256 projectId, string proofHash)",
  "function vote(uint256 projectId, uint8 voteType, string comment) payable",
  "function getProject(uint256 projectId) view returns (tuple(uint256 id, address government, address contractor, string title, string description, uint256 budget, uint256 vetoThreshold, uint8 status, uint256 totalVotes, uint256 approveVotes, uint256 vetoVotes, bool proofSubmitted, string proofHash))",
  "function getVotes(uint256 projectId) view returns (tuple(address voter, uint8 voteType, uint256 amount, string comment, uint256 timestamp)[])"
];

export function SimpleHome() {
  const { provider, address } = useWallet();
  const [activeTab, setActiveTab] = useState<"create" | "vote" | "view">("create");
  
  // Government form
  const [contractor, setContractor] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("1");
  const [vetoThreshold, setVetoThreshold] = useState("3");
  
  // Contractor form
  const [projectId, setProjectId] = useState("");
  const [proofHash, setProofHash] = useState("");
  
  // Voter form
  const [voteProjectId, setVoteProjectId] = useState("");
  const [voteType, setVoteType] = useState<0 | 1>(0); // 0 = Approve, 1 = Veto
  const [comment, setComment] = useState("");
  const [voteAmount, setVoteAmount] = useState("0.1");

  const createProject = async () => {
    if (!provider || !address) return;
    
    const signer = await provider.getSigner();
    const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    
    const tx = await contract.createProject(
      contractor,
      title,
      description,
      parseEther(budget),
      parseInt(vetoThreshold),
      { value: parseEther(budget) }
    );
    
    await tx.wait();
    alert("Project created!");
  };

  const submitProof = async () => {
    if (!provider || !address) return;
    
    const signer = await provider.getSigner();
    const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    
    const tx = await contract.submitProof(parseInt(projectId), proofHash);
    await tx.wait();
    alert("Proof submitted!");
  };

  const voteOnProject = async () => {
    if (!provider || !address) return;
    
    const signer = await provider.getSigner();
    const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    
    const tx = await contract.vote(
      parseInt(voteProjectId),
      voteType,
      comment,
      { value: parseEther(voteAmount) }
    );
    
    await tx.wait();
    alert("Vote submitted!");
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Simple Public Works</h1>
      
      <div className="flex gap-4 mb-6">
        <button 
          className={`px-4 py-2 rounded ${activeTab === "create" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
          onClick={() => setActiveTab("create")}
        >
          Government: Create Project
        </button>
        <button 
          className={`px-4 py-2 rounded ${activeTab === "vote" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
          onClick={() => setActiveTab("vote")}
        >
          Public: Vote on Project
        </button>
        <button 
          className={`px-4 py-2 rounded ${activeTab === "view" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
          onClick={() => setActiveTab("view")}
        >
          View Projects
        </button>
      </div>

      {activeTab === "create" && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Create New Project</h2>
          <div className="space-y-4">
            <div>
              <label className="block mb-1">Contractor Address</label>
              <input 
                type="text" 
                className="w-full p-2 border rounded"
                value={contractor}
                onChange={(e) => setContractor(e.target.value)}
                placeholder="0x..."
              />
            </div>
            <div>
              <label className="block mb-1">Project Title</label>
              <input 
                type="text" 
                className="w-full p-2 border rounded"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Bridge Construction"
              />
            </div>
            <div>
              <label className="block mb-1">Description</label>
              <textarea 
                className="w-full p-2 border rounded"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Project details..."
              />
            </div>
            <div>
              <label className="block mb-1">Budget (ETH)</label>
              <input 
                type="number" 
                className="w-full p-2 border rounded"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="1"
              />
            </div>
            <div>
              <label className="block mb-1">Veto Threshold</label>
              <input 
                type="number" 
                className="w-full p-2 border rounded"
                value={vetoThreshold}
                onChange={(e) => setVetoThreshold(e.target.value)}
                placeholder="3"
              />
              <p className="text-sm text-gray-600 mt-1">Number of veto votes needed to cancel project</p>
            </div>
            <button 
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              onClick={createProject}
            >
              Create Project & Lock {budget} ETH
            </button>
          </div>
        </div>
      )}

      {activeTab === "vote" && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Vote on Project</h2>
          <div className="space-y-4">
            <div>
              <label className="block mb-1">Project ID</label>
              <input 
                type="number" 
                className="w-full p-2 border rounded"
                value={voteProjectId}
                onChange={(e) => setVoteProjectId(e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <label className="block mb-1">Vote Type</label>
              <select 
                className="w-full p-2 border rounded"
                value={voteType}
                onChange={(e) => setVoteType(parseInt(e.target.value) as 0 | 1)}
              >
                <option value={0}>Approve ✅</option>
                <option value={1}>Veto ❌</option>
              </select>
            </div>
            <div>
              <label className="block mb-1">Comment</label>
              <input 
                type="text" 
                className="w-full p-2 border rounded"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Your opinion..."
              />
            </div>
            <div>
              <label className="block mb-1">ETH to Stake</label>
              <input 
                type="number" 
                className="w-full p-2 border rounded"
                value={voteAmount}
                onChange={(e) => setVoteAmount(e.target.value)}
                placeholder="0.1"
              />
              <p className="text-sm text-gray-600 mt-1">You stake ETH to vote. If project succeeds, you get it back.</p>
            </div>
            <button 
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              onClick={voteOnProject}
            >
              Vote with {voteAmount} ETH
            </button>
          </div>
        </div>
      )}

      {activeTab === "view" && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">All Projects</h2>
          <p className="text-gray-600">Projects will appear here after creation</p>
        </div>
      )}
    </div>
  );
}
