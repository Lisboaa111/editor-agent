import { useRef, useState, useCallback } from "react"
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward,
  Scissors,
  Trash2,
  Volume2,
  VolumeX,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTimelineStore } from "../stores/timelineStore"
import { formatTime } from "../utils/time"

interface TimelineProps {
  onSplit?: () => void;
  onDelete?: () => void;
}

export function Timeline({ onSplit, onDelete }: TimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  
  const { 
    tracks, 
    currentTime, 
    duration, 
    selectedClipId,
    setCurrentTime,
    selectClip,
    removeClip,
    splitClip,
  } = useTimelineStore()

  const handleTimelineClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return
    
    const rect = timelineRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = x / (rect.width * zoom)
    const newTime = Math.max(0, Math.min(duration, percentage * duration))
    
    setCurrentTime(newTime)
  }, [duration, zoom, setCurrentTime])

  const handleClipClick = (e: React.MouseEvent, clipId: string) => {
    e.stopPropagation()
    selectClip(clipId)
  }

  const handleSplit = () => {
    if (selectedClipId) {
      splitClip(selectedClipId, currentTime)
      onSplit?.()
    }
  }

  const handleDelete = () => {
    if (selectedClipId) {
      removeClip(selectedClipId)
      onDelete?.()
    }
  }

  const pixelsPerSecond = 50 * zoom

  return (
    <div className="h-40 border-t border-[#262626] bg-[#0d0d0d] flex flex-col">
      {/* Timeline toolbar */}
      <div className="h-9 border-b border-[#262626] flex items-center justify-between px-2">
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="w-7 h-7"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="w-7 h-7"
            onClick={() => setCurrentTime(0)}
          >
            <SkipBack className="w-3.5 h-3.5" />
          </Button>

          <Button 
            variant="ghost" 
            size="icon" 
            className="w-7 h-7"
            onClick={() => setCurrentTime(duration)}
          >
            <SkipForward className="w-3.5 h-3.5" />
          </Button>

          <div className="h-4 w-px bg-[#333] mx-1" />

          <Button 
            variant="ghost" 
            size="icon" 
            className="w-7 h-7"
            onClick={handleSplit}
            disabled={!selectedClipId}
            title="Split clip at playhead"
          >
            <Scissors className="w-3.5 h-3.5" />
          </Button>

          <Button 
            variant="ghost" 
            size="icon" 
            className="w-7 h-7"
            onClick={handleDelete}
            disabled={!selectedClipId}
            title="Delete selected clip"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-[#a3a3a3]">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <div className="h-4 w-px bg-[#333] mx-1" />

          <Button 
            variant="ghost" 
            size="icon" 
            className="w-7 h-7"
            onClick={() => setIsMuted(!isMuted)}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </Button>

          <div className="h-4 w-px bg-[#333] mx-1" />

          <select 
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="h-6 bg-[#171717] border border-[#303030] rounded text-xs px-1"
          >
            <option value={0.5}>50%</option>
            <option value={1}>100%</option>
            <option value={2}>200%</option>
            <option value={4}>400%</option>
          </select>
        </div>
      </div>

      {/* Timeline tracks */}
      <div className="flex-1 flex overflow-hidden">
        {/* Track labels */}
        <div className="w-20 border-r border-[#262626] flex flex-col">
          {tracks.map((track, i) => (
            <div 
              key={track.id}
              className="h-8 flex items-center px-2 text-[10px] text-[#525252] border-b border-[#1a1a1a]"
            >
              {track.type === 'video' ? 'V' + (i + 1) : 'A' + (i - 1)}
            </div>
          ))}
        </div>

        {/* Timeline content */}
        <div 
          ref={timelineRef}
          className="flex-1 overflow-x-auto relative"
          onClick={handleTimelineClick}
        >
          {/* Time ruler */}
          <div className="h-6 border-b border-[#262626] flex relative" style={{ width: duration * pixelsPerSecond }}>
            {Array.from({ length: Math.ceil(duration) + 1 }).map((_, i) => (
              <div 
                key={i}
                className="absolute text-[10px] text-[#525252]"
                style={{ left: i * pixelsPerSecond }}
              >
                {i}s
              </div>
            ))}
          </div>

          {/* Playhead */}
          <div 
            className="absolute top-0 bottom-0 w-px bg-[#00c08b] z-10 pointer-events-none"
            style={{ left: currentTime * pixelsPerSecond }}
          />

          {/* Tracks */}
          {tracks.map((track) => (
            <div 
              key={track.id}
              className="h-8 border-b border-[#1a1a1a] relative"
              style={{ width: duration * pixelsPerSecond }}
            >
              {track.clips.map((clip) => (
                <div
                  key={clip.id}
                  onClick={(e) => handleClipClick(e, clip.id)}
                  className={`absolute top-1 h-6 rounded cursor-pointer transition-colors ${
                    selectedClipId === clip.id 
                      ? "bg-[#00c08b] text-black" 
                      : "bg-[#333] text-[#d4d4d4] hover:bg-[#404040]"
                  }`}
                  style={{
                    left: clip.startTime * pixelsPerSecond,
                    width: (clip.endTime - clip.startTime) * pixelsPerSecond,
                  }}
                >
                  <span className="text-[10px] px-1 truncate block">
                    {clip.media?.name || 'Clip'}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
