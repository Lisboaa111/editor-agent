import { useState } from "react"
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize,
  Settings,
  Upload,
  Film,
  Image,
  Music,
  Scissors,
  Type,
  Sparkles,
  Layers,
  Undo,
  Redo,
  Download,
  Share2,
  MoreHorizontal,
  ChevronRight,
  Clock,
  TrendingUp,
  Zap,
  Mic,
  Video,
  FileVideo,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface MediaItem {
  id: string
  type: "video" | "image" | "audio"
  name: string
  duration?: string
  thumbnail?: string
}

interface TimelineClip {
  id: string
  name: string
  startTime: number
  duration: number
  type: "video" | "audio" | "text"
}

function App() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime] = useState("00:00:15")
  const [totalTime] = useState("00:01:30")
  const [activeTool, setActiveTool] = useState("cut")

  const mediaItems: MediaItem[] = [
    { id: "1", type: "video", name: "beach_clip.mp4", duration: "0:15" },
    { id: "2", type: "video", name: "sunset_drone.mp4", duration: "0:22" },
    { id: "3", type: "image", name: "intro_image.jpg" },
    { id: "4", type: "audio", name: "background_music.mp3", duration: "2:30" },
    { id: "5", type: "video", name: "city_timelapse.mp4", duration: "0:08" },
    { id: "6", type: "image", name: "logo.png" },
  ]

  const timelineClips: TimelineClip[] = [
    { id: "1", name: "Intro", startTime: 0, duration: 5, type: "video" },
    { id: "2", name: "Beach", startTime: 5, duration: 15, type: "video" },
    { id: "3", name: "Text Overlay", startTime: 8, duration: 3, type: "text" },
    { id: "4", name: "Music", startTime: 0, duration: 25, type: "audio" },
  ]

  const tools = [
    { id: "cut", icon: Scissors, label: "Cut" },
    { id: "text", icon: Type, label: "Text" },
    { id: "effects", icon: Sparkles, label: "Effects" },
    { id: "layers", icon: Layers, label: "Layers" },
  ]

  return (
    <TooltipProvider>
      <div className="h-screen flex flex-col bg-background overflow-hidden">
        {/* Header */}
        <header className="h-14 border-b bg-card flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Video className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-lg">ReelForge</span>
            </div>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="w-8 h-8">
                    <Undo className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Undo</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="w-8 h-8">
                    <Redo className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Redo</TooltipContent>
              </Tooltip>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <Zap className="w-3 h-3" />
              AI Powered
            </Badge>
            <Button variant="ghost" size="sm" className="gap-1">
              <Share2 className="w-4 h-4" />
              Share
            </Button>
            <Button size="sm" className="gap-1 bg-primary hover:bg-primary/90">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Media Library */}
          <aside className="w-64 border-r bg-card flex flex-col shrink-0">
            <div className="p-3 border-b">
              <h2 className="font-semibold text-sm">Media</h2>
            </div>
            <div className="p-2">
              <Button variant="outline" className="w-full justify-start gap-2 text-muted-foreground">
                <Upload className="w-4 h-4" />
                Upload Media
              </Button>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {mediaItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-secondary cursor-pointer transition-colors group"
                  >
                    <div className="w-10 h-10 rounded bg-secondary flex items-center justify-center shrink-0">
                      {item.type === "video" && <Film className="w-4 h-4 text-muted-foreground" />}
                      {item.type === "image" && <Image className="w-4 h-4 text-muted-foreground" />}
                      {item.type === "audio" && <Music className="w-4 h-4 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{item.name}</p>
                      {item.duration && (
                        <p className="text-xs text-muted-foreground">{item.duration}</p>
                      )}
                    </div>
                    <MoreHorizontal className="w-4 h-4 opacity-0 group-hover:opacity-100 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </ScrollArea>
          </aside>

          {/* Center - Preview */}
          <main className="flex-1 flex flex-col">
            {/* Preview Area */}
            <div className="flex-1 bg-black flex items-center justify-center relative p-4">
              <div className="relative aspect-[9/16] max-h-full bg-zinc-900 rounded-lg overflow-hidden flex items-center justify-center">
                <FileVideo className="w-16 h-16 text-zinc-700" />
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-xs text-zinc-500">9:16 Reel</p>
                </div>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="h-12 border-t bg-card flex items-center justify-center gap-2 px-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="w-8 h-8">
                    <SkipBack className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Previous</TooltipContent>
              </Tooltip>
              <Button
                size="icon"
                className="w-10 h-10 rounded-full"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </Button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="w-8 h-8">
                    <SkipForward className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Next</TooltipContent>
              </Tooltip>
              <Separator orientation="vertical" className="h-6 mx-2" />
              <span className="text-sm font-mono text-muted-foreground">
                {currentTime} / {totalTime}
              </span>
              <Separator orientation="vertical" className="h-6 mx-2" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8"
                    onClick={() => setIsMuted(!isMuted)}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{isMuted ? "Unmute" : "Mute"}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="w-8 h-8">
                    <Maximize className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Fullscreen</TooltipContent>
              </Tooltip>
            </div>

            {/* Timeline */}
            <div className="h-48 border-t bg-card flex flex-col">
              {/* Timeline Header */}
              <div className="h-8 border-b flex items-center justify-between px-4">
                <div className="flex items-center gap-2">
                  {tools.map((tool) => (
                    <Tooltip key={tool.id}>
                      <TooltipTrigger asChild>
                        <Button
                          variant={activeTool === tool.id ? "secondary" : "ghost"}
                          size="icon"
                          className="w-7 h-7"
                          onClick={() => setActiveTool(tool.id)}
                        >
                          <tool.icon className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{tool.label}</TooltipContent>
                    </Tooltip>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>00:00:00</span>
                  <ChevronRight className="w-3 h-3" />
                  <span>{totalTime}</span>
                </div>
              </div>
              {/* Timeline Tracks */}
              <ScrollArea className="flex-1">
                <div className="p-2 min-w-[800px]">
                  {/* Time ruler */}
                  <div className="h-4 flex items-center border-b mb-1">
                    {Array.from({ length: 31 }, (_, i) => (
                      <div key={i} className="flex items-center">
                        {i % 5 === 0 && (
                          <span className="text-[10px] text-muted-foreground w-8">
                            0:{i.toString().padStart(2, "0")}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  {/* Video Track */}
                  <div className="h-12 flex items-center gap-1 mb-1">
                    <span className="w-16 text-xs text-muted-foreground shrink-0">Video</span>
                    <div className="flex-1 h-full bg-secondary rounded relative">
                      {timelineClips
                        .filter((c) => c.type === "video")
                        .map((clip) => (
                          <div
                            key={clip.id}
                            className="absolute h-8 top-1 bg-primary rounded-sm cursor-pointer hover:brightness-110 transition-all"
                            style={{
                              left: `${(clip.startTime / 30) * 100}%`,
                              width: `${(clip.duration / 30) * 100}%`,
                            }}
                          >
                            <span className="text-[10px] px-1 truncate block text-primary-foreground">
                              {clip.name}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                  {/* Text Track */}
                  <div className="h-8 flex items-center gap-1 mb-1">
                    <span className="w-16 text-xs text-muted-foreground shrink-0">Text</span>
                    <div className="flex-1 h-full bg-secondary rounded relative">
                      {timelineClips
                        .filter((c) => c.type === "text")
                        .map((clip) => (
                          <div
                            key={clip.id}
                            className="absolute h-5 top-1 bg-amber-600/80 rounded-sm cursor-pointer"
                            style={{
                              left: `${(clip.startTime / 30) * 100}%`,
                              width: `${(clip.duration / 30) * 100}%`,
                            }}
                          >
                            <span className="text-[10px] px-1 truncate block text-white">
                              {clip.name}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                  {/* Audio Track */}
                  <div className="h-12 flex items-center gap-1">
                    <span className="w-16 text-xs text-muted-foreground shrink-0">Audio</span>
                    <div className="flex-1 h-full bg-secondary rounded relative overflow-hidden">
                      {timelineClips
                        .filter((c) => c.type === "audio")
                        .map((clip) => (
                          <div
                            key={clip.id}
                            className="absolute h-full top-0 bg-emerald-600/60 rounded-sm cursor-pointer"
                            style={{
                              left: `${(clip.startTime / 30) * 100}%`,
                              width: `${(clip.duration / 30) * 100}%`,
                            }}
                          >
                            <div className="h-full waveform" />
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </div>
          </main>

          {/* Right Sidebar - Properties */}
          <aside className="w-64 border-l bg-card flex flex-col shrink-0">
            <div className="p-3 border-b flex items-center justify-between">
              <h2 className="font-semibold text-sm">Properties</h2>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="w-7 h-7">
                    <Settings className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Project Settings</DropdownMenuItem>
                  <DropdownMenuItem>Preferences</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Keyboard Shortcuts</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-4">
                <Card>
                  <CardContent className="p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Clip Selected</span>
                      <Badge variant="outline">Beach</Badge>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground">Duration</label>
                      <p className="text-sm">0:15</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground">Start</label>
                      <p className="text-sm">0:05</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground">End</label>
                      <p className="text-sm">0:20</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-3 space-y-3">
                    <span className="text-sm font-medium">AI Enhancements</span>
                    <div className="space-y-2">
                      <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                        <Sparkles className="w-4 h-4" />
                        Auto Enhance
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                        <Mic className="w-4 h-4" />
                        Voice Over
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Auto Captions
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </aside>
        </div>
      </div>
    </TooltipProvider>
  )
}

export default App
