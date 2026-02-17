import { useState, useRef, useCallback } from "react"
import { 
  FileVideo,
  PanelLeftOpen,
  PanelRightOpen,
  MessageCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { NearWalletProvider } from "./contexts/NearWallet"
import { WalletPanel, ChatPanel, ExportPanel } from "./components/AppComponents"
import { useCreditsStore } from "./stores/credits"
import { calculatePrice } from "./config"
import { Timeline } from "./components/Timeline"
import { MediaLibrary } from "./components/MediaLibrary"
import { useTimelineStore } from "./stores/timelineStore"
import { MediaItem, generateId } from "./types/timeline"
import { uploadMedia } from "./lib/agent"

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
  aspectRatio: '9:16' | '16:9' | '1:1'
}

function AppContent() {
  const [leftOpen, setLeftOpen] = useState(true)
  const [rightOpen, setRightOpen] = useState(true)
  const [showChat, setShowChat] = useState(false)
  const [chatLoading, setChatLoading] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [mediaFiles, setMediaFiles] = useState<File[]>([])
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewType, setPreviewType] = useState<'video' | 'image' | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  
  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    quality: "1080p",
    length: 15,
    format: "mp4",
    hasAudio: true,
    aspectRatio: "9:16",
  })

  const { user } = useCreditsStore()
  const { 
    addClip, 
    tracks,
    textOverlays,
    setCurrentTime,
  } = useTimelineStore()
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Simple video sync - just track time from video
  const handlePlayPause = useCallback((playing: boolean) => {
    if (videoRef.current) {
      if (playing) {
        videoRef.current.play().catch(console.error)
      } else {
        videoRef.current.pause()
      }
    }
    setIsPlaying(playing)
  }, [])

  const handleClipSelect = useCallback((_clipId: string, mediaUrl?: string) => {
    if (mediaUrl) {
      setPreviewUrl(mediaUrl)
      setPreviewType('video')
    }
  }, [])

  const getVideoDuration = useCallback((file: File): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement('video')
      video.preload = 'metadata'
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src)
        resolve(video.duration || 5)
      }
      video.onerror = () => {
        URL.revokeObjectURL(video.src)
        resolve(5)
      }
      video.src = URL.createObjectURL(file)
    })
  }, [])

  const exportPrice = calculatePrice(
    exportSettings.quality, 
    exportSettings.length, 
    exportSettings.format,
    exportSettings.hasAudio
  )

  const handleSendMessage = async (content: string) => {
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMsg])
    setChatLoading(true)

    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      let response = "I've received your request. I'm analyzing the best way to create your reel."
      
      if (content.toLowerCase().includes("import") || content.toLowerCase().includes("upload")) {
        response = "Please use the Import button in the Media Library to add your photos and videos. Then tell me what kind of edit you'd like!"
      } else if (content.toLowerCase().includes("create") || content.toLowerCase().includes("make")) {
        response = "I'll help you create that reel! Import your media first, then I can help you edit it. What clips do you have?"
      } else if (content.toLowerCase().includes("export")) {
        response = `To export, make sure you have ${exportPrice} credits. You currently have ${user.credits} credits. Use the panel on the right to configure export settings.`
      }
      
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, assistantMsg])
    } catch (error) {
      console.error("Chat error:", error)
    } finally {
      setChatLoading(false)
    }
  }

  const handleImportMedia = async (newFiles: File[]) => {
    const uploadedFiles: { file: File; serverPath: string }[] = [];
    
    for (const file of newFiles) {
      try {
        const result = await uploadMedia(file);
        uploadedFiles.push({ file, serverPath: result.path });
      } catch (error) {
        console.error("Failed to upload file:", file.name, error);
      }
    }

    for (const { file, serverPath } of uploadedFiles) {
      if (file.type.startsWith('video/')) {
        const dur = await getVideoDuration(file)
        Object.defineProperty(file, 'duration', { value: dur, writable: true })
        
        const media: MediaItem = {
          id: generateId(),
          name: file.name,
          type: 'video',
          url: URL.createObjectURL(file),
          duration: dur,
          serverPath,
        }
        addClip('video-1', media)
      } else if (file.type.startsWith('image/')) {
        const media: MediaItem = {
          id: generateId(),
          name: file.name,
          type: 'image',
          url: URL.createObjectURL(file),
          duration: 5,
          serverPath,
        }
        addClip('video-1', media)
      }
    }
    
    setMediaFiles(prev => [...prev, ...uploadedFiles.map(f => f.file)])
    
    const firstFile = newFiles[0]
    if (firstFile) {
      if (firstFile.type.startsWith("image/")) {
        setPreviewUrl(URL.createObjectURL(firstFile))
        setPreviewType('image')
      } else if (firstFile.type.startsWith("video/")) {
        const url = URL.createObjectURL(firstFile)
        setPreviewUrl(url)
        setPreviewType('video')
      }
    }
  }

  const handleRemoveMedia = (idx: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== idx))
  }

  const handleSelectMedia = (media: MediaItem) => {
    setSelectedMediaId(media.id)
    
    if (media.type === 'video') {
      setPreviewUrl(media.url)
      setPreviewType('video')
    } else if (media.type === 'image') {
      setPreviewUrl(media.url)
      setPreviewType('image')
    }
  }

  const handleAddToTimeline = () => {
    const file = mediaFiles[0]
    if (!file) return

    const fileDuration = (file as File & { duration?: number }).duration || 5

    const media: MediaItem = {
      id: generateId(),
      name: file.name,
      type: file.type.startsWith('video/') ? 'video' : file.type.startsWith('image/') ? 'image' : 'audio',
      url: URL.createObjectURL(file),
      duration: fileDuration,
    }

    addClip('video-1', media)
  }

  return (
    <div className="h-screen flex flex-col bg-[#0d0d0d] text-[#e5e5e5]">
      {/* Header */}
      <header className="h-12 border-b border-[#262626] flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 border border-[#404040] flex items-center justify-center rounded">
              <FileVideo className="w-4 h-4 text-[#00c08b]" />
            </div>
            <span className="text-sm font-medium text-[#d4d4d4]">ReelForge</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm"
            className={`gap-2 ${showChat ? 'bg-[#171717]' : ''}`}
            onClick={() => setShowChat(!showChat)}
          >
            <MessageCircle className="w-4 h-4" />
            <span className="text-xs">AI Chat</span>
          </Button>
          <WalletPanel />
        </div>
      </header>

      {/* Main */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left - Media Library */}
        {leftOpen && (
          <MediaLibrary 
            files={mediaFiles}
            onImport={handleImportMedia}
            onRemove={handleRemoveMedia}
            onSelectMedia={handleSelectMedia}
            selectedMediaId={selectedMediaId || undefined}
          />
        )}
        
        {!leftOpen && (
          <div className="w-10 flex flex-col items-center pt-3 bg-[#0d0d0d] border-r border-[#262626]">
            <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => setLeftOpen(true)}>
              <PanelLeftOpen className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Center - Preview */}
        <main className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 flex items-center justify-center p-1 bg-[#0a0a0a] overflow-hidden">
            {previewUrl && previewType === 'video' ? (
              <div className="h-full max-w-[50%] aspect-video bg-[#141414] border border-[#262626] flex items-center justify-center rounded overflow-hidden">
                <video 
                  ref={videoRef}
                  src={previewUrl}
                  className="max-h-full max-w-full object-contain"
                  onTimeUpdate={() => {
                    if (videoRef.current) {
                      setCurrentTime(videoRef.current.currentTime)
                    }
                  }}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => {
                    setIsPlaying(false)
                    setCurrentTime(0)
                  }}
                  onError={(e) => console.error('Video error:', e)}
                />
              </div>
            ) : previewUrl && previewType === 'image' ? (
              <div className="h-full max-w-[50%] aspect-video bg-[#141414] border border-[#262626] flex items-center justify-center rounded overflow-hidden">
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            ) : (
              <div className="h-full max-w-[50%] aspect-video bg-[#141414] border border-[#262626] flex items-center justify-center rounded">
                <div className="text-center">
                  <FileVideo className="w-12 h-12 text-[#262626] mx-auto mb-2" />
                  <p className="text-xs text-[#525252]">Import media to preview</p>
                  {mediaFiles.length > 0 && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={handleAddToTimeline}
                    >
                      Add to Timeline
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Timeline */}
          <Timeline 
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            onClipSelect={handleClipSelect}
          />
        </main>

        {/* Right - Chat & Properties */}
        {showChat && (
          <ChatPanel 
            messages={messages}
            onSend={handleSendMessage}
            isLoading={chatLoading}
            onClose={() => setShowChat(false)}
          />
        )}

        {!showChat && rightOpen && (
          <ExportPanel 
            settings={exportSettings}
            onChange={setExportSettings}
            credits={user.credits}
            timelineClips={tracks.flatMap(t => t.clips).map(c => ({
              id: c.id,
              mediaUrl: c.media?.url || '',
              mediaName: c.media?.name || '',
              serverPath: c.media?.serverPath || '',
              startTime: c.startTime,
              endTime: c.endTime,
              duration: c.endTime - c.startTime,
              type: c.media?.type || 'video',
            }))}
            textOverlays={textOverlays.map(o => ({
              text: o.text,
              startTime: o.startTime,
              endTime: o.endTime,
              x: o.x,
              y: o.y,
              fontSize: o.fontSize,
              color: o.color,
            }))}
          />
        )}

        {!rightOpen && !showChat && (
          <div className="w-10 flex flex-col items-center pt-3 bg-[#0d0d0d] border-l border-[#262626]">
            <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => setRightOpen(true)}>
              <PanelRightOpen className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="video/*,image/*,audio/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) {
            handleImportMedia(Array.from(e.target.files))
          }
        }}
      />
    </div>
  )
}

function App() {
  return (
    <NearWalletProvider>
      <AppContent />
    </NearWalletProvider>
  )
}

export default App
