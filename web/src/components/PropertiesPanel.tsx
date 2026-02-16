import { useState } from "react"
import { 
  Sliders,
  Type,
  Image as ImageIcon,
  Maximize2,
  Move,
  Volume2,
  Sun,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useTimelineStore } from "../stores/timelineStore"

interface PropertiesPanelProps {
  onAddText?: () => void
  onAddImage?: () => void
}

export function PropertiesPanel({ onAddText, onAddImage }: PropertiesPanelProps) {
  const { 
    tracks, 
    selectedClipId, 
    textOverlays,
    updateClip,
    updateTextOverlay,
    removeTextOverlay,
  } = useTimelineStore()

  const selectedClip = tracks
    .flatMap(t => t.clips)
    .find(c => c.id === selectedClipId)

  const [activeTab, setActiveTab] = useState<'clip' | 'text'>('clip')

  return (
    <div className="w-64 border-l border-[#262626] bg-[#0d0d0d] flex flex-col">
      {/* Tabs */}
      <div className="flex border-b border-[#262626]">
        <button
          onClick={() => setActiveTab('clip')}
          className={`flex-1 py-2 text-xs ${
            activeTab === 'clip' 
              ? 'text-[#00c08b] border-b-2 border-[#00c08b]' 
              : 'text-[#525252]'
          }`}
        >
          <Sliders className="w-3 h-3 inline mr-1" />
          Clip
        </button>
        <button
          onClick={() => setActiveTab('text')}
          className={`flex-1 py-2 text-xs ${
            activeTab === 'text' 
              ? 'text-[#00c08b] border-b-2 border-[#00c08b]' 
              : 'text-[#525252]'
          }`}
        >
          <Type className="w-3 h-3 inline mr-1" />
          Text
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-3">
        {activeTab === 'clip' && (
          <div className="space-y-4">
            {!selectedClip ? (
              <p className="text-xs text-[#525252] text-center py-4">
                Select a clip to edit properties
              </p>
            ) : (
              <>
                {/* Transform */}
                <div className="space-y-2">
                  <h4 className="text-xs text-[#a3a3a3] flex items-center gap-1">
                    <Move className="w-3 h-3" />
                    Transform
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-[#525252]">X Position</label>
                      <input 
                        type="number" 
                        className="w-full h-7 bg-[#171717] border border-[#303030] rounded px-2 text-xs"
                        defaultValue={0}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-[#525252]">Y Position</label>
                      <input 
                        type="number" 
                        className="w-full h-7 bg-[#171717] border border-[#303030] rounded px-2 text-xs"
                        defaultValue={0}
                      />
                    </div>
                  </div>
                </div>

                <Separator className="bg-[#262626]" />

                {/* Scale & Rotation */}
                <div className="space-y-2">
                  <h4 className="text-xs text-[#a3a3a3] flex items-center gap-1">
                    <Maximize2 className="w-3 h-3" />
                    Scale & Rotation
                  </h4>
                  
                  <div>
                    <label className="text-[10px] text-[#525252]">Scale</label>
                    <input 
                      type="range" 
                      min="0.1" 
                      max="2" 
                      step="0.1"
                      defaultValue="1"
                      className="w-full h-1 bg-[#262626] rounded-full"
                    />
                  </div>
                  
                  <div>
                    <label className="text-[10px] text-[#525252]">Rotation</label>
                    <input 
                      type="range" 
                      min="-180" 
                      max="180" 
                      step="1"
                      defaultValue="0"
                      className="w-full h-1 bg-[#262626] rounded-full"
                    />
                  </div>
                </div>

                <Separator className="bg-[#262626]" />

                {/* Volume */}
                <div className="space-y-2">
                  <h4 className="text-xs text-[#a3a3a3] flex items-center gap-1">
                    <Volume2 className="w-3 h-3" />
                    Audio
                  </h4>
                  
                  <div>
                    <label className="text-[10px] text-[#525252]">Volume</label>
                    <input 
                      type="range" 
                      min="0" 
                      max="1" 
                      step="0.1"
                      defaultValue={selectedClip?.volume || 1}
                      onChange={(e) => {
                        if (selectedClipId) {
                          updateClip(selectedClipId, { volume: parseFloat(e.target.value) })
                        }
                      }}
                      className="w-full h-1 bg-[#262626] rounded-full"
                    />
                  </div>
                </div>

                <Separator className="bg-[#262626]" />

                {/* Effects */}
                <div className="space-y-2">
                  <h4 className="text-xs text-[#a3a3a3] flex items-center gap-1">
                    <Sun className="w-3 h-3" />
                    Effects
                  </h4>
                  
                  <div>
                    <label className="text-[10px] text-[#525252]">Brightness</label>
                    <input 
                      type="range" 
                      min="0" 
                      max="2" 
                      step="0.1"
                      defaultValue="1"
                      className="w-full h-1 bg-[#262626] rounded-full"
                    />
                  </div>
                  
                  <div>
                    <label className="text-[10px] text-[#525252]">Contrast</label>
                    <input 
                      type="range" 
                      min="0" 
                      max="2" 
                      step="0.1"
                      defaultValue="1"
                      className="w-full h-1 bg-[#262626] rounded-full"
                    />
                  </div>
                  
                  <div>
                    <label className="text-[10px] text-[#525252]">Saturation</label>
                    <input 
                      type="range" 
                      min="0" 
                      max="2" 
                      step="0.1"
                      defaultValue="1"
                      className="w-full h-1 bg-[#262626] rounded-full"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'text' && (
          <div className="space-y-4">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={onAddText}
            >
              <Type className="w-3 h-3 mr-2" />
              Add Text
            </Button>

            {textOverlays.length === 0 ? (
              <p className="text-xs text-[#525252] text-center py-4">
                No text overlays yet
              </p>
            ) : (
              <div className="space-y-2">
                {textOverlays.map(overlay => (
                  <div 
                    key={overlay.id}
                    className="p-2 bg-[#171717] rounded border border-[#303030]"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-[#d4d4d4] truncate">{overlay.text}</span>
                      <button 
                        onClick={() => removeTextOverlay(overlay.id)}
                        className="text-[#525252] hover:text-red-400"
                      >
                        ×
                      </button>
                    </div>
                    
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={overlay.text}
                        onChange={(e) => updateTextOverlay(overlay.id, { text: e.target.value })}
                        className="w-full h-7 bg-[#0d0d0d] border border-[#303030] rounded px-2 text-xs"
                      />
                      
                      <div>
                        <label className="text-[10px] text-[#525252]">Font Size</label>
                        <input 
                          type="number" 
                          value={overlay.fontSize}
                          onChange={(e) => updateTextOverlay(overlay.id, { fontSize: parseInt(e.target.value) })}
                          className="w-full h-7 bg-[#0d0d0d] border border-[#303030] rounded px-2 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add buttons */}
      <div className="p-2 border-t border-[#262626] space-y-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full"
          onClick={onAddImage}
        >
          <ImageIcon className="w-3 h-3 mr-2" />
          Add Image Overlay
        </Button>
      </div>
    </div>
  )
}
