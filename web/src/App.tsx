import { useState } from "react"
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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

function App() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [leftOpen, setLeftOpen] = useState(true)
  const [rightOpen, setRightOpen] = useState(true)

  return (
    <div className="h-screen flex flex-col bg-[#111] text-white">
      {/* Header */}
      <header className="h-12 border-b border-[#222] flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer">
            <div className="w-8 h-8 rounded border border-white/20 flex items-center justify-center">
              <Video className="w-4 h-4 text-gray-300" />
            </div>
            <span className="font-normal text-sm tracking-tight text-gray-300">ReelForge</span>
          </button>
          <Separator orientation="vertical" className="h-4 bg-[#333]" />
          <span className="text-sm text-gray-500 font-light">Untitled Project</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Auto-saved</span>
          <Button variant="ghost" size="sm" className="text-xs h-8">
            Export
          </Button>
        </div>
      </header>

      {/* Main */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left - Media */}
        {leftOpen && (
          <aside className="w-64 border-r border-[#222] flex flex-col shrink-0">
            <div className="p-3 border-b border-[#222]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">Media</span>
                <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => setLeftOpen(false)}>
                  <PanelLeftClose className="w-4 h-4" />
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
                <input 
                  type="text" 
                  placeholder="Search..." 
                  className="w-full h-8 pl-7 bg-[#1a1a1a] border border-[#333] rounded text-sm placeholder:text-gray-600 focus:outline-none focus:border-[#444]"
                />
              </div>
            </div>
            
            <div className="flex-1 p-2 space-y-1 overflow-auto">
              {[
                { type: "video", name: "clip_001.mp4", duration: "0:15" },
                { type: "video", name: "clip_002.mp4", duration: "0:22" },
                { type: "image", name: "intro.jpg" },
                { type: "audio", name: "music.mp3", duration: "2:30" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded hover:bg-[#1a1a1a] cursor-pointer">
                  <div className="w-8 h-8 bg-[#222] rounded flex items-center justify-center">
                    {item.type === "video" && <Film className="w-4 h-4 text-gray-500" />}
                    {item.type === "image" && <Image className="w-4 h-4 text-gray-500" />}
                    {item.type === "audio" && <Music className="w-4 h-4 text-gray-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs truncate">{item.name}</p>
                    {item.duration && <p className="text-[10px] text-gray-600">{item.duration}</p>}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-2 border-t border-[#222]">
              <Button variant="outline" className="w-full h-8 text-xs justify-start gap-2">
                <Upload className="w-3 h-3" />
                Import
              </Button>
            </div>
          </aside>
        )}

        {/* Left toggle */}
        {!leftOpen && (
          <div className="w-10 flex flex-col items-center pt-3 shrink-0">
            <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => setLeftOpen(true)}>
              <PanelLeftOpen className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Center */}
        <main className="flex-1 flex flex-col">
          {/* Preview */}
          <div className="flex-1 flex items-center justify-center p-8 bg-[#0a0a0a]">
            <div className="aspect-[9/16] max-h-full bg-[#151515] rounded-lg border border-[#222] flex items-center justify-center">
              <FileVideo className="w-12 h-12 text-[#333]" />
            </div>
          </div>

          {/* Controls */}
          <div className="h-12 border-t border-[#222] flex items-center justify-center gap-4 px-6">
            <Button variant="ghost" size="icon" className="w-8 h-8">
              <SkipBack className="w-4 h-4" />
            </Button>
            <Button 
              size="icon" 
              className="w-10 h-10 rounded-full"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="w-8 h-8">
              <SkipForward className="w-4 h-4" />
            </Button>
            
            <Separator orientation="vertical" className="h-6 bg-[#333]" />
            
            <span className="text-xs font-mono text-gray-500 min-w-[80px]">
              00:00:15 / 00:01:30
            </span>
            
            <Separator orientation="vertical" className="h-6 bg-[#333]" />
            
            <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => setIsMuted(!isMuted)}>
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>
          </div>

          {/* Timeline */}
          <div className="h-40 border-t border-[#222] flex flex-col">
            {/* Timeline toolbar */}
            <div className="h-10 border-b border-[#222] flex items-center justify-between px-4">
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="w-7 h-7">
                  <Undo className="w-3 h-3" />
                </Button>
                <Button variant="ghost" size="icon" className="w-7 h-7">
                  <Redo className="w-3 h-3" />
                </Button>
                <Separator orientation="vertical" className="h-5 bg-[#333] mx-1" />
                <Button variant="ghost" size="icon" className="w-7 h-7">
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="w-6 h-6">
                  <ZoomOut className="w-3 h-3" />
                </Button>
                <span className="text-[10px] text-gray-500 w-8 text-center">100%</span>
                <Button variant="ghost" size="icon" className="w-6 h-6">
                  <ZoomIn className="w-3 h-3" />
                </Button>
              </div>
            </div>
            
            {/* Tracks */}
            <div className="flex-1 p-2 overflow-x-auto">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-12 text-[10px] text-gray-600 shrink-0">Video</span>
                <div className="flex-1 h-8 bg-[#1a1a1a] rounded relative">
                  <div className="absolute left-[16%] w-[50%] h-6 top-1 bg-[#333] rounded cursor-pointer" />
                </div>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-12 text-[10px] text-gray-600 shrink-0">Audio</span>
                <div className="flex-1 h-8 bg-[#1a1a1a] rounded relative">
                  <div className="absolute left-[0%] w-[83%] h-6 top-1 bg-[#2a3a2a] rounded" />
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Right toggle */}
        {!rightOpen && (
          <div className="w-10 flex flex-col items-center pt-3 shrink-0">
            <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => setRightOpen(true)}>
              <PanelRightOpen className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Right - Properties */}
        {rightOpen && (
          <aside className="w-64 border-l border-[#222] flex flex-col shrink-0">
            <div className="p-3 border-b border-[#222] flex items-center justify-between">
              <span className="text-sm">Properties</span>
              <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => setRightOpen(false)}>
                <PanelRightClose className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex-1 p-3 space-y-4 overflow-auto">
              <div className="space-y-2">
                <label className="text-xs text-gray-500">Start</label>
                <input type="text" className="w-full h-8 bg-[#1a1a1a] border border-[#333] rounded px-2 text-xs" defaultValue="0:05" />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-gray-500">Duration</label>
                <input type="text" className="w-full h-8 bg-[#1a1a1a] border border-[#333] rounded px-2 text-xs" defaultValue="0:15" />
              </div>
              
              <Separator className="bg-[#222]" />
              
              <div className="space-y-2">
                <label className="text-xs text-gray-500">Scale</label>
                <input type="range" className="w-full" />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-gray-500">Rotation</label>
                <input type="range" className="w-full" />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-gray-500">Opacity</label>
                <input type="range" className="w-full" />
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}

export default App
