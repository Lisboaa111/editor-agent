import { useState, useEffect } from "react"

interface AgentInfo {
  accountId: string
  balance: string
  status: string
}

function App() {
  const [agentInfo, setAgentInfo] = useState<AgentInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("actions")

  const AGENT_URL = import.meta.env.VITE_AGENT_URL || "http://localhost:3000"

  useEffect(() => {
    fetchAgentInfo()
  }, [])

  const fetchAgentInfo = async () => {
    try {
      setLoading(true)
      const [accountRes, balanceRes, healthRes] = await Promise.all([
        fetch(`${AGENT_URL}/api/agent-account`),
        fetch(`${AGENT_URL}/api/balance`),
        fetch(`${AGENT_URL}/api/health`),
      ])

      if (!healthRes.ok) throw new Error("Agent not running")

      const accountData = await accountRes.json()
      const balanceData = await balanceRes.json()

      setAgentInfo({
        accountId: accountData.accountId,
        balance: formatNear(balanceData.balance),
        status: "online",
      })
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect")
    } finally {
      setLoading(false)
    }
  }

  const formatNear = (yocto: string): string => {
    const near = parseInt(yocto) / 1e24
    return near.toFixed(4)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Retro Agent</h1>
          <button
            onClick={fetchAgentInfo}
            className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : error ? (
          <div className="max-w-md mx-auto bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold text-red-600 mb-2">Connection Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchAgentInfo}
              className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="bg-white rounded-lg border p-6">
                <p className="text-sm text-gray-500 mb-1">Status</p>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  <span className="text-2xl font-bold">{agentInfo?.status}</span>
                </div>
              </div>

              <div className="bg-white rounded-lg border p-6">
                <p className="text-sm text-gray-500 mb-1">Account</p>
                <span className="text-2xl font-bold truncate">{agentInfo?.accountId}</span>
              </div>

              <div className="bg-white rounded-lg border p-6">
                <p className="text-sm text-gray-500 mb-1">Balance</p>
                <span className="text-2xl font-bold">{agentInfo?.balance} Ⓝ</span>
              </div>
            </div>

            <div className="bg-white rounded-lg border">
              <div className="flex border-b">
                {["actions", "logs", "settings"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-3 text-sm font-medium capitalize ${
                      activeTab === tab
                        ? "border-b-2 border-gray-900 text-gray-900"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {activeTab === "actions" && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Agent Actions</h3>
                    <p className="text-gray-600">Interact with your Shade Agent</p>
                    <div className="flex gap-4">
                      <button className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800">
                        Send Transaction
                      </button>
                      <button className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                        View History
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === "logs" && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Activity Logs</h3>
                    <p className="text-gray-500">No activity yet</p>
                  </div>
                )}

                {activeTab === "settings" && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Settings</h3>
                    <p className="text-gray-500">Agent URL: {AGENT_URL}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
