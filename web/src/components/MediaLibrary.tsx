import { useState, useCallback, useRef } from "react"
import { 
  Upload,
  Film,
  Image,
  Music,
  X,
  Search,
  Grid,
  List,
  Trash2,
} from "lucide-react"
import { MediaItem } from "../types/timeline"

interface MediaLibraryProps {
  files: File[]
  onImport: (files: File[]) => void
  onRemove: (idx: number) => void
  onSelectMedia?: (media: MediaItem) => void
  selectedMediaId?: string
}

export function MediaLibrary({ 
  files, 
  onImport, 
  onRemove,
}: MediaLibraryProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'video' | 'image' | 'audio'>('all')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getMediaType = (file: File): 'video' | 'image' | 'audio' => {
    if (file.type.startsWith('video/')) return 'video'
    if (file.type.startsWith('image/')) return 'image'
    return 'audio'
  }

  const filteredFiles = files.filter(file => {
    const type = getMediaType(file)
    const matchesFilter = filterType === 'all' || type === filterType
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const getIcon = (type: 'video' | 'image' | 'audio') => {
    switch (type) {
      case 'video': return <Film className="w-5 h-5" />
      case 'image': return <Image className="w-5 h-5" />
      case 'audio': return <Music className="w-5 h-5" />
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      f => f.type.startsWith('video/') || f.type.startsWith('image/') || f.type.startsWith('audio/')
    )
    if (droppedFiles.length > 0) {
      onImport(droppedFiles)
    }
  }, [onImport])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  return (
    <div 
      className="w-64 border-r border-[#262626] flex flex-col bg-[#0d0d0d]"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {/* Header */}
      <div className="p-3 border-b border-[#262626]">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-[#a3a3a3]">Media Library</span>
          <div className="flex gap-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded ${viewMode === 'grid' ? 'bg-[#262626]' : ''}`}
            >
              <Grid className="w-4 h-4 text-[#525252]" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1 rounded ${viewMode === 'list' ? 'bg-[#262626]' : ''}`}
            >
              <List className="w-4 h-4 text-[#525252]" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-2">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#525252]" />
          <input
            type="text"
            placeholder="Search media..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-7 pl-7 bg-[#171717] border border-[#303030] text-xs rounded focus:outline-none focus:border-[#404040]"
          />
        </div>

        {/* Filter */}
        <div className="flex gap-1">
          {(['all', 'video', 'image', 'audio'] as const).map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`text-[10px] px-2 py-1 rounded capitalize ${
                filterType === type 
                  ? 'bg-[#00c08b] text-black' 
                  : 'bg-[#171717] text-[#525252] hover:text-[#a3a3a3]'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Media list */}
      <div className="flex-1 overflow-auto p-2">
        {filteredFiles.length === 0 ? (
          <div className="text-center py-8">
            <Upload className="w-8 h-8 text-[#262626] mx-auto mb-2" />
            <p className="text-xs text-[#525252]">
              {files.length === 0 ? 'Drag & drop media here' : 'No media matches filter'}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 gap-2">
            {filteredFiles.map((file, idx) => {
              const type = getMediaType(file)
              
              return (
                <div
                  key={idx}
                  className="relative aspect-square rounded overflow-hidden cursor-pointer group"
                >
                  {type === 'image' ? (
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#171717] flex items-center justify-center">
                      {getIcon(type)}
                    </div>
                  )}
                  
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        const originalIdx = files.indexOf(file)
                        onRemove(originalIdx)
                      }}
                      className="p-1.5 bg-red-500/20 rounded-full hover:bg-red-500/40"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                  
                  <div className="absolute bottom-0 left-0 right-0 p-1 bg-gradient-to-t from-black/80 to-transparent">
                    <p className="text-[10px] text-white truncate">{file.name}</p>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredFiles.map((file, idx) => {
              const type = getMediaType(file)
              
              return (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-[#1a1a1a]"
                >
                  <div className="w-10 h-10 bg-[#171717] rounded flex items-center justify-center shrink-0">
                    {getIcon(type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#d4d4d4] truncate">{file.name}</p>
                    <p className="text-[10px] text-[#525252] capitalize">{type}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      const originalIdx = files.indexOf(file)
                      onRemove(originalIdx)
                    }}
                    className="p-1 hover:bg-[#262626] rounded"
                  >
                    <X className="w-3 h-3 text-[#525252]" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Import button */}
      <div className="p-2 border-t border-[#262626]">
        <input
          ref={fileInputRef}
          id="media-file-input"
          type="file"
          multiple
          accept="video/*,image/*,audio/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) {
              onImport(Array.from(e.target.files))
            }
          }}
        />
        <label
          htmlFor="media-file-input"
          className="w-full h-8 px-3 text-xs flex items-center justify-center gap-2 bg-[#00c08b] hover:bg-[#00a07a] text-black rounded cursor-pointer font-medium"
        >
          <Upload className="w-3 h-3" />
          Import Media
        </label>
      </div>
    </div>
  )
}
