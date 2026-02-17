import { useState, useRef, useEffect } from "react"
import { 
  Wallet, 
  CreditCard, 
  LogOut, 
  Send,
  Loader2,
  Video,
  Image,
  Music,
  X,
  FileVideo,
  Film,
  Sparkles,
  Download,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useNearWallet } from "../contexts/NearWallet"
import { useCreditsStore } from "../stores/credits"
import { API_URL } from "../config";
import { 
  generateEditingPlan, 
  processVideo, 
  getJobStatus, 
  refineEditingPlan,
  getMusicTracks,
  type EditingPlan,
  type TimelineClip,
  type TextOverlay,
  type MusicTrack
} from "../lib/agent";
import { PACKAGES, calculatePrice, EXPORT_QUALITY, VIDEO_FORMATS, VIDEO_LENGTHS } from "../config";

const AGENT_ACCOUNT = "myagent123.testnet"

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface ExportSettings {
  quality: string
  length: number
  format: string
  hasAudio: boolean
}

export function WalletPanel() {
  const { accountId, isSignedIn, signIn, signOut, signAndSendTransaction } = useNearWallet()
  const { user, addCredits, setAccountId } = useCreditsStore()
  const [showPayment, setShowPayment] = useState(false)
  const [purchasing, setPurchasing] = useState(false)
  const [status, setStatus] = useState("")

  const handleSignIn = async () => {
    await signIn()
    if (accountId) {
      setAccountId(accountId)
    }
  }

  const handlePurchase = async (pkgId: string) => {
    const pkg = PACKAGES.find(p => p.id === pkgId)
    if (!pkg || !isSignedIn || !accountId) return

    setPurchasing(true)
    setStatus("Check wallet to confirm...")

    try {
      const txHash = await signAndSendTransaction(AGENT_ACCOUNT, pkg.price.toString())
      console.log('Transaction hash:', txHash)
      addCredits(pkg.credits)
      setStatus("Payment successful!")
      setTimeout(() => {
        setShowPayment(false)
        setStatus("")
      }, 2000)
    } catch (e) {
      console.error(e)
      setStatus("Transaction cancelled")
      setTimeout(() => {
        setStatus("")
      }, 2000)
    } finally {
      setPurchasing(false)
    }
  }

  if (!isSignedIn) {
    return (
      <Button 
        onClick={handleSignIn}
        className="bg-[#00c08b] hover:bg-[#00a07a] text-black font-medium"
      >
        <Wallet className="w-4 h-4 mr-2" />
        Connect Wallet
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Button 
        variant="ghost" 
        size="sm" 
        className="gap-2"
        onClick={() => setShowPayment(!showPayment)}
      >
        <CreditCard className="w-4 h-4" />
        <span>{user.credits} credits</span>
      </Button>
      
      <div className="flex items-center gap-2 px-2 py-1 bg-[#171717] rounded border border-[#262626]">
        <Badge variant="secondary" className="bg-[#262626]">
          {accountId?.slice(0, 12)}...
        </Badge>
        <Button variant="ghost" size="icon" className="w-6 h-6" onClick={signOut}>
          <LogOut className="w-3 h-3" />
        </Button>
      </div>

      {showPayment && (
        <div className="absolute right-4 top-12 w-80 bg-[#171717] border border-[#303030] rounded-lg p-4 shadow-xl z-50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-[#d4d4d4]">Purchase Credits</h3>
            <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => setShowPayment(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-2">
            {PACKAGES.map((pkg) => (
              <button
                key={pkg.id}
                onClick={() => handlePurchase(pkg.id)}
                disabled={purchasing}
                className="w-full p-3 rounded border flex items-center justify-between transition-colors bg-[#0d0d0d] border-[#262626] hover:border-[#404040]"
              >
                <div className="text-left">
                  <p className="text-sm text-[#d4d4d4]">{pkg.name}</p>
                  <p className="text-xs text-[#525252]">{pkg.credits} credits</p>
                </div>
                <Badge variant="secondary" className="bg-[#262626]">
                  {pkg.price} NEAR
                </Badge>
              </button>
            ))}
          </div>

          {status && (
            <div className={`mt-3 p-2 rounded text-xs text-center ${
              status.includes("success") ? "bg-[#00c08b]/20 text-[#00c08b]" : "bg-[#262626]"
            }`}>
              {status}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function ChatPanel({ 
  messages, 
  onSend,
  isLoading,
  onClose 
}: { 
  messages: ChatMessage[]
  onSend: (msg: string) => void
  isLoading: boolean
  onClose: () => void
}) {
  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      onSend(input)
      setInput("")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="w-72 border-l border-[#262626] flex flex-col bg-[#0d0d0d]">
      <div className="p-3 border-b border-[#262626] flex items-center justify-between">
        <span className="text-sm text-[#a3a3a3]">AI Assistant</span>
        <Button variant="ghost" size="icon" className="w-6 h-6" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-3 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xs text-[#525252]">
              Describe what you want and I'll help create your reel
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[85%] p-2 rounded text-xs ${
                msg.role === "user" 
                  ? "bg-[#00c08b] text-black" 
                  : "bg-[#171717] border border-[#262626] text-[#d4d4d4]"
              }`}>
                {msg.content}
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-[#171717] border border-[#262626] p-2 rounded">
              <Loader2 className="w-4 h-4 animate-spin text-[#525252]" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-[#262626]">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your reel..."
            className="flex-1 h-8 bg-[#171717] border border-[#303030] px-3 text-xs rounded focus:outline-none focus:border-[#404040]"
          />
          <Button size="icon" className="h-8 w-8" onClick={handleSend} disabled={isLoading}>
            <Send className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export function MediaLibrary({ 
  files, 
  onImport,
  onRemove 
}: { 
  files: File[]
  onImport: () => void
  onRemove: (idx: number) => void
}) {
  return (
    <div className="w-56 border-r border-[#262626] flex flex-col bg-[#0d0d0d]">
      <div className="p-3 border-b border-[#262626]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-[#a3a3a3]">Media Library</span>
        </div>
      </div>

      <div className="flex-1 p-2 space-y-1 overflow-auto">
        {files.length === 0 ? (
          <div className="text-center py-8">
            <FileVideo className="w-8 h-8 mx-auto text-[#262626] mb-2" />
            <p className="text-xs text-[#525252]">No media imported</p>
          </div>
        ) : (
          files.map((file, i) => (
            <div key={i} className="flex items-center gap-2 p-2 hover:bg-[#1a1a1a] rounded group">
              {file.type.startsWith("video") && <Film className="w-4 h-4 text-[#525252]" />}
              {file.type.startsWith("image") && <Image className="w-4 h-4 text-[#525252]" />}
              {file.type.startsWith("audio") && <Music className="w-4 h-4 text-[#525252]" />}
              <span className="flex-1 text-xs truncate text-[#d4d4d4]">{file.name}</span>
              <button 
                onClick={() => onRemove(i)}
                className="opacity-0 group-hover:opacity-100"
              >
                <X className="w-3 h-3 text-[#525252]" />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="p-2 border-t border-[#262626]">
        <input
          type="file"
          id="media-import"
          multiple
          accept="video/*,image/*,audio/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) {
              onImport()
            }
          }}
        />
        <label 
          htmlFor="media-import"
          className="w-full h-8 px-3 text-xs flex items-center justify-center gap-2 bg-[#171717] border border-[#303030] rounded cursor-pointer hover:bg-[#1a1a1a]"
        >
          <Video className="w-3 h-3" />
          Import Media
        </label>
      </div>
    </div>
  )
}

export function ExportPanel({ 
  settings,
  onChange,
  credits,
  timelineClips = [],
  textOverlays = [],
}: { 
  settings: ExportSettings
  onChange: (settings: ExportSettings) => void
  credits: number
  canExport?: boolean
  timelineClips?: TimelineClip[]
  textOverlays?: TextOverlay[]
}) {
  const _price = calculatePrice(settings.quality, settings.length, settings.format, settings.hasAudio)
  const canExport = credits >= _price
  
  const [isGenerating, setIsGenerating] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [jobId, setJobId] = useState<string | null>(null)
  const [jobStatus, setJobStatus] = useState<string>('idle')
  const [progress, setProgress] = useState(0)
  const [editingPlan, setEditingPlan] = useState<EditingPlan | null>(null)
  const [aiPrompt, setAiPrompt] = useState('')
  const [refineFeedback, setRefineFeedback] = useState('')
  const [musicTracks, setMusicTracks] = useState<MusicTrack[]>([])
  const [selectedMusic, setSelectedMusic] = useState<MusicTrack | null>(null)

  useEffect(() => {
    getMusicTracks().then(setMusicTracks).catch(console.error)
  }, [])

  const handleGenerateWithAI = async () => {
    if (timelineClips.length === 0) {
      alert('Add clips to timeline first')
      return
    }
    
    setIsGenerating(true)
    try {
      const result = await generateEditingPlan(
        timelineClips,
        textOverlays,
        aiPrompt || undefined,
        settings.quality,
        settings.format
      )
      
      if (result.success && result.plan) {
        setEditingPlan(result.plan)
        alert('AI editing plan generated! Click "Generate Video" to process.')
      }
    } catch (error) {
      console.error('AI generation error:', error)
      alert('Failed to generate AI plan. Make sure the agent is running with OpenRouter API key.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerateVideo = async () => {
    if (timelineClips.length === 0) {
      alert('Add clips to timeline first')
      return
    }
    
    if (!canExport) {
      alert('Not enough credits!')
      return
    }
    
    setIsProcessing(true)
    try {
      const result = await processVideo(
        timelineClips,
        textOverlays,
        settings.quality,
        settings.length,
        settings.format,
        settings.hasAudio,
        editingPlan || undefined,
        selectedMusic?.url || undefined,
        settings.aspectRatio || '9:16'
      )
      
      if (result.success) {
        setJobId(result.jobId)
        setJobStatus('processing')
        
        // Poll for status
        const pollStatus = async () => {
          const status = await getJobStatus(result.jobId)
          setJobStatus(status.status)
          setProgress(status.progress)
          
          if (status.status === 'completed') {
            setIsProcessing(false)
            alert('Video ready! Click Download to save.')
          } else if (status.status === 'failed') {
            setIsProcessing(false)
            alert('Video processing failed: ' + status.error)
          } else {
            setTimeout(pollStatus, 2000)
          }
        }
        
        setTimeout(pollStatus, 2000)
      }
    } catch (error) {
      console.error('Video processing error:', error)
      alert('Failed to process video')
      setIsProcessing(false)
    }
  }

  const handleDownload = () => {
    if (jobId) {
      window.open(`${API_URL}/api/video/download/${jobId}`, '_blank')
    }
  }

  const handleRefine = async () => {
    if (!editingPlan || !refineFeedback) return
    
    try {
      const result = await refineEditingPlan(editingPlan, refineFeedback)
      if (result.success && result.plan) {
        setEditingPlan(result.plan)
        setRefineFeedback('')
        alert('Plan refined!')
      }
    } catch (error) {
      console.error('Refine error:', error)
      alert('Failed to refine plan')
    }
  }

  return (
    <div className="w-56 border-l border-[#262626] bg-[#0d0d0d] p-4 space-y-4">
      <h3 className="text-sm font-medium text-[#a3a3a3]">Export Settings</h3>

      <div className="space-y-3">
        <div>
          <label className="text-xs text-[#525252] block mb-1">Quality</label>
          <select
            value={settings.quality}
            onChange={(e) => onChange({ ...settings, quality: e.target.value })}
            className="w-full h-8 bg-[#171717] border border-[#303030] rounded px-2 text-xs"
          >
            {EXPORT_QUALITY.map(q => (
              <option key={q.id} value={q.id}>{q.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-[#525252] block mb-1">Format</label>
          <select
            value={settings.format}
            onChange={(e) => onChange({ ...settings, format: e.target.value })}
            className="w-full h-8 bg-[#171717] border border-[#303030] rounded px-2 text-xs"
          >
            {VIDEO_FORMATS.map(f => (
              <option key={f.id} value={f.id}>{f.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-[#525252] block mb-1">Aspect Ratio</label>
          <select
            value={settings.aspectRatio || '9:16'}
            onChange={(e) => onChange({ ...settings, aspectRatio: e.target.value as '9:16' | '16:9' | '1:1' })}
            className="w-full h-8 bg-[#171717] border border-[#303030] rounded px-2 text-xs"
          >
            <option value="9:16">9:16 (Vertical/Reel)</option>
            <option value="16:9">16:9 (Landscape)</option>
            <option value="1:1">1:1 (Square)</option>
          </select>
        </div>

        <div>
          <label className="text-xs text-[#525252] block mb-1">Length</label>
          <select
            value={settings.length}
            onChange={(e) => onChange({ ...settings, length: parseInt(e.target.value) })}
            className="w-full h-8 bg-[#171717] border border-[#303030] rounded px-2 text-xs"
          >
            {VIDEO_LENGTHS.map(l => (
              <option key={l.id} value={l.id}>{l.label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="audio"
            checked={settings.hasAudio}
            onChange={(e) => onChange({ ...settings, hasAudio: e.target.checked })}
            className="rounded"
          />
          <label htmlFor="audio" className="text-xs text-[#a3a3a3]">Include Audio</label>
        </div>

        {settings.hasAudio && (
          <div className="space-y-2">
            <label className="text-xs text-[#525252] block">Background Music</label>
            <select
              value={selectedMusic?.id || ''}
              onChange={(e) => {
                const track = musicTracks.find(t => t.id === e.target.value) || null;
                setSelectedMusic(track);
              }}
              className="w-full h-8 bg-[#171717] border border-[#303030] rounded px-2 text-xs"
            >
              <option value="">No music</option>
              {musicTracks.filter(t => t.url).map(track => (
                <option key={track.id} value={track.id}>
                  {track.name} - {track.artist}
                </option>
              ))}
            </select>
            {selectedMusic?.url && (
              <audio
                controls
                src={`${API_URL}${selectedMusic.url}`}
                className="w-full h-8 mt-1"
              />
            )}
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-[#262626] space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-[#525252]">Cost</span>
          <span className="text-[#d4d4d4]">{_price} credits</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-[#525252]">Balance</span>
          <span className="text-[#d4d4d4]">{credits} credits</span>
        </div>
      </div>

      {/* AI Prompt Input */}
      <div className="pt-4 border-t border-[#262626] space-y-2">
        <label className="text-xs text-[#525252] block">AI Prompt (optional)</label>
        <input
          type="text"
          value={aiPrompt}
          onChange={(e) => setAiPrompt(e.target.value)}
          placeholder="e.g., Make it exciting with quick cuts"
          className="w-full h-8 bg-[#171717] border border-[#303030] rounded px-2 text-xs"
        />
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <Button 
          className="w-full gap-2" 
          onClick={handleGenerateWithAI}
          disabled={isGenerating || timelineClips.length === 0}
          variant="outline"
        >
          {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Generate AI Plan
        </Button>
        
        {editingPlan && (
          <div className="text-xs text-[#525252] p-2 bg-[#171717] rounded">
            <p className="font-medium text-[#a3a3a3]">AI Plan Ready:</p>
            <p className="mt-1">{editingPlan.summary}</p>
            <div className="mt-2 flex gap-1">
              <input
                type="text"
                value={refineFeedback}
                onChange={(e) => setRefineFeedback(e.target.value)}
                placeholder="Request changes..."
                className="flex-1 h-6 bg-[#0d0d0d] border border-[#303030] rounded px-1 text-xs"
              />
              <Button size="sm" onClick={handleRefine} className="h-6 px-2">
                <RefreshCw className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}
        
        <Button 
          className="w-full gap-2" 
          onClick={handleGenerateVideo}
          disabled={isProcessing || !canExport || timelineClips.length === 0}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing {progress}%
            </>
          ) : (
            <>
              <Video className="w-4 h-4" />
              Generate Video
            </>
          )}
        </Button>
        
        {jobStatus === 'completed' && (
          <Button 
            className="w-full gap-2 bg-[#00c08b] hover:bg-[#00a07a]" 
            onClick={handleDownload}
          >
            <Download className="w-4 h-4" />
            Download Video
          </Button>
        )}
      </div>
    </div>
  )
}
