import { useState, useEffect } from "react"
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Upload,
  Film,
  Image,
  Music,
  Undo,
  Redo,
  Video,
  FileVideo,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  ZoomIn,
  ZoomOut,
  Search,
  Plus,
  Wallet,
  CreditCard,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { getNearAccount, sendNearPayment } from "./lib/agent"
import { PRICING, PACKAGES } from "./config"

function App() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [leftOpen, setLeftOpen] = useState(true)
  const [rightOpen, setRightOpen] = useState(true)
  const [agentAccountId, setAgentAccountId] = useState<string>("")
  const [agentBalance, setAgentBalance] = useState<string>("0")
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null)
  const [credits, setCredits] = useState(0)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<string>("")

  useEffect(() => {
    fetchAgentAccount()
  }, [])

  const fetchAgentAccount = async () => {
    try {
      const account = await getNearAccount()
      setAgentAccountId(account.accountId)
      setAgentBalance(account.balance)
    } catch (error) {
      console.error("Failed to fetch agent account:", error)
    }
  }

  const handlePurchase = async (packageId: string) => {
    const pkg = PACKAGES.find(p => p.id === packageId)
    if (!pkg || !agentAccountId) return

    setSelectedPackage(packageId)
    setIsProcessingPayment(true)
    setPaymentStatus("Processing payment...")

    try {
      await sendNearPayment(agentAccountId, pkg.price.toString(), true)
      setPaymentStatus("Payment successful!")
      setCredits(prev => prev + pkg.credits)
      setTimeout(() => {
        setShowPaymentModal(false)
        setSelectedPackage(null)
        setPaymentStatus("")
      }, 2000)
    } catch (error) {
      console.error("Payment failed:", error)
      setPaymentStatus("Payment failed. Please try again.")
    } finally {
      setIsProcessingPayment(false)
    }
  }

  const handleExport = (quality: string) => {
    const cost = PRICING[`export_${quality}` as keyof typeof PRICING]
    if (credits >= parseFloat(cost) || cost === undefined) {
      alert(`Exporting at ${quality}... (Demo)`)
    } else {
      setShowPaymentModal(true)
    }
  }

  return (
    <div className="h-screen flex flex-col bg-[#0d0d0d] text-[#e5e5e5]">
      {/* Header */}
      <header className="h-11 border-b border-[#262626] flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 hover:opacity-70 transition-opacity cursor-pointer">
            <div className="w-6 h-6 border border-[#404040] flex items-center justify-center">
              <Video className="w-3.5 h-3.5 text-[#a3a3a3]" />
            </div>
            <span className="text-sm text-[#d4d4d4]">ReelForge</span>
          </button>
          <Separator orientation="vertical" className="h-3.5 bg-[#333]" />
          <span className="text-sm text-[#737373]">Untitled Project</span>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs h-7 px-3 gap-2"
            onClick={() => setShowPaymentModal(true)}
          >
            <Wallet className="w-3 h-3" />
            <CreditCard className="w-3 h-3" />
            <span>{credits} credits</span>
          </Button>
          <span className="text-xs text-[#525252]">Auto-saved</span>
          <Button variant="ghost" size="sm" className="text-xs h-7 px-3" onClick={() => handleExport('1080p')}>
            Export
          </Button>
        </div>
      </header>

      {/* Main */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left - Media */}
        {leftOpen && (
          <aside className="w-56 border-r border-[#262626] flex flex-col shrink-0">
            <div className="p-3 border-b border-[#262626]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-[#a3a3a3]">Media</span>
                <Button variant="ghost" size="icon" className="w-5 h-5" onClick={() => setLeftOpen(false)}>
                  <PanelLeftClose className="w-3.5 h-3.5" />
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#525252]" />
                <input 
                  type="text" 
                  placeholder="Search" 
                  className="w-full h-7 pl-7 bg-[#171717] border border-[#303030] text-xs placeholder:text-[#525252] focus:outline-none focus:border-[#404040]"
                />
              </div>
            </div>
            
            <div className="flex-1 p-1.5 space-y-0.5 overflow-auto">
              {[
                { type: "video", name: "clip_001.mp4", duration: "0:15" },
                { type: "video", name: "clip_002.mp4", duration: "0:22" },
                { type: "image", name: "intro.jpg" },
                { type: "audio", name: "music.mp3", duration: "2:30" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 p-1.5 hover:bg-[#1a1a1a] cursor-pointer">
                  <div className="w-7 h-7 bg-[#262626] flex items-center justify-center">
                    {item.type === "video" && <Film className="w-3.5 h-3.5 text-[#525252]" />}
                    {item.type === "image" && <Image className="w-3.5 h-3.5 text-[#525252]" />}
                    {item.type === "audio" && <Music className="w-3.5 h-3.5 text-[#525252]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs truncate text-[#d4d4d4]">{item.name}</p>
                    {item.duration && <p className="text-[10px] text-[#525252]">{item.duration}</p>}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-2 border-t border-[#262626]">
              <button className="w-full h-7 px-2 text-xs justify-start gap-2 flex items-center text-[#737373] hover:text-[#a3a3a3] hover:bg-[#1a1a1a] cursor-pointer border border-[#303030]">
                <Upload className="w-3 h-3" />
                Import
              </button>
            </div>
          </aside>
        )}

        {/* Left toggle */}
        {!leftOpen && (
          <div className="w-9 flex flex-col items-center pt-2.5 shrink-0">
            <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => setLeftOpen(true)}>
              <PanelLeftOpen className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Center */}
        <main className="flex-1 flex flex-col">
          {/* Preview */}
          <div className="flex-1 flex items-center justify-center p-6 bg-[#0a0a0a]">
            <div className="aspect-[9/16] max-h-full bg-[#141414] border border-[#262626] flex items-center justify-center">
              <FileVideo className="w-10 h-10 text-[#262626]" />
            </div>
          </div>

          {/* Controls */}
          <div className="h-11 border-t border-[#262626] flex items-center justify-center gap-3 px-4">
            <Button variant="ghost" size="icon" className="w-7 h-7">
              <SkipBack className="w-3.5 h-3.5" />
            </Button>
            <Button 
              size="icon" 
              className="w-9 h-9 rounded-full"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="w-7 h-7">
              <SkipForward className="w-3.5 h-3.5" />
            </Button>
            
            <Separator orientation="vertical" className="h-5 bg-[#333]" />
            
            <span className="text-xs font-mono text-[#525252] min-w-[75px]">
              00:00:15 / 00:01:30
            </span>
            
            <Separator orientation="vertical" className="h-5 bg-[#333]" />
            
            <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => setIsMuted(!isMuted)}>
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </Button>
          </div>

          {/* Timeline */}
          <div className="h-36 border-t border-[#262626] flex flex-col">
            {/* Timeline toolbar */}
            <div className="h-9 border-b border-[#262626] flex items-center justify-between px-3">
              <div className="flex items-center gap-0.5">
                <Button variant="ghost" size="icon" className="w-6 h-6">
                  <Undo className="w-3 h-3" />
                </Button>
                <Button variant="ghost" size="icon" className="w-6 h-6">
                  <Redo className="w-3 h-3" />
                </Button>
                <Separator orientation="vertical" className="h-4 bg-[#333] mx-1" />
                <Button variant="ghost" size="icon" className="w-6 h-6">
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
              
              <div className="flex items-center gap-1.5">
                <Button variant="ghost" size="icon" className="w-5 h-5">
                  <ZoomOut className="w-3 h-3" />
                </Button>
                <span className="text-[10px] text-[#525252] w-7 text-center">100%</span>
                <Button variant="ghost" size="icon" className="w-5 h-5">
                  <ZoomIn className="w-3 h-3" />
                </Button>
              </div>
            </div>
            
            {/* Tracks */}
            <div className="flex-1 p-1.5 overflow-x-auto">
              <div className="flex items-center gap-1.5">
                <span className="w-10 text-[10px] text-[#525252] shrink-0">Video</span>
                <div className="flex-1 h-7 bg-[#1a1a1a] relative">
                  <div className="absolute left-[16%] w-[50%] h-5 top-1 bg-[#333] cursor-pointer" />
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-10 text-[10px] text-[#525252] shrink-0">Audio</span>
                <div className="flex-1 h-7 bg-[#1a1a1a] relative">
                  <div className="absolute left-[0%] w-[83%] h-5 top-1 bg-[#2a332a]" />
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Right toggle */}
        {!rightOpen && (
          <div className="w-9 flex flex-col items-center pt-2.5 shrink-0">
            <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => setRightOpen(true)}>
              <PanelRightOpen className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Right - Properties */}
        {rightOpen && (
          <aside className="w-56 border-l border-[#262626] flex flex-col shrink-0">
            <div className="p-3 border-b border-[#262626] flex items-center justify-between">
              <span className="text-sm text-[#a3a3a3]">Properties</span>
              <Button variant="ghost" size="icon" className="w-5 h-5" onClick={() => setRightOpen(false)}>
                <PanelRightClose className="w-3.5 h-3.5" />
              </Button>
            </div>
            
            <div className="flex-1 p-3 space-y-3 overflow-auto">
              <div className="space-y-1.5">
                <label className="text-xs text-[#525252]">Start</label>
                <input type="text" className="w-full h-7 bg-[#171717] border border-[#303030] px-2 text-xs" defaultValue="0:05" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-[#525252]">Duration</label>
                <input type="text" className="w-full h-7 bg-[#171717] border border-[#303030] px-2 text-xs" defaultValue="0:15" />
              </div>
              
              <Separator className="bg-[#262626]" />
              
              <div className="space-y-1.5">
                <label className="text-xs text-[#525252]">Scale</label>
                <input type="range" className="w-full h-1 bg-[#262626] rounded-full" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-[#525252]">Rotation</label>
                <input type="range" className="w-full h-1 bg-[#262626] rounded-full" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-[#525252]">Opacity</label>
                <input type="range" className="w-full h-1 bg-[#262626] rounded-full" />
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowPaymentModal(false)}>
          <div className="bg-[#171717] border border-[#303030] rounded-lg p-6 w-[400px] max-w-[90vw]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#d4d4d4]">Purchase Credits</h2>
              <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => setShowPaymentModal(false)}>
                <span className="text-xl">&times;</span>
              </Button>
            </div>

            {agentAccountId && (
              <div className="mb-4 p-3 bg-[#0d0d0d] rounded border border-[#262626]">
                <p className="text-xs text-[#525252] mb-1">Agent Account</p>
                <p className="text-xs text-[#a3a3a3] font-mono">{agentAccountId}</p>
                <p className="text-xs text-[#525252] mt-2">Balance</p>
                <p className="text-sm text-[#d4d4d4]">{agentBalance} NEAR</p>
              </div>
            )}

            <div className="mb-4">
              <p className="text-sm text-[#a3a3a3] mb-2">Current Credits: <span className="text-[#d4d4d4] font-bold">{credits}</span></p>
            </div>

            <div className="space-y-2 mb-4">
              {PACKAGES.map((pkg) => (
                <button
                  key={pkg.id}
                  onClick={() => handlePurchase(pkg.id)}
                  disabled={isProcessingPayment}
                  className={`w-full p-3 rounded border flex items-center justify-between transition-colors ${
                    selectedPackage === pkg.id 
                      ? "border-[#00c08b] bg-[#00c08b]/10" 
                      : "border-[#303030] hover:border-[#404040] bg-[#0d0d0d]"
                  }`}
                >
                  <div className="text-left">
                    <p className="text-sm text-[#d4d4d4] font-medium">{pkg.name}</p>
                    <p className="text-xs text-[#525252]">{pkg.credits} credits</p>
                  </div>
                  <Badge variant="secondary" className="bg-[#262626] text-[#a3a3a3]">
                    {pkg.price} NEAR
                  </Badge>
                </button>
              ))}
            </div>

            {paymentStatus && (
              <div className={`p-3 rounded text-sm text-center ${
                paymentStatus.includes("success") 
                  ? "bg-[#00c08b]/10 text-[#00c08b]" 
                  : "bg-red-900/20 text-red-400"
              }`}>
                {paymentStatus}
              </div>
            )}

            <p className="text-xs text-[#525252] mt-4 text-center">
              Payments powered by Shade Agent on NEAR Testnet
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
