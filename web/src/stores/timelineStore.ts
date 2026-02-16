import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TimelineState, Clip, TextOverlay, MediaItem, Track, createDefaultTimeline, generateId } from '../types/timeline';

interface TimelineStore extends TimelineState {
  addClip: (trackId: string, media: MediaItem) => void;
  removeClip: (clipId: string) => void;
  updateClip: (clipId: string, updates: Partial<Clip>) => void;
  moveClip: (clipId: string, trackId: string, newStartTime: number) => void;
  splitClip: (clipId: string, splitTime: number) => void;
  addTextOverlay: (overlay: Omit<TextOverlay, 'id'>) => void;
  removeTextOverlay: (id: string) => void;
  updateTextOverlay: (id: string, updates: Partial<TextOverlay>) => void;
  setCurrentTime: (time: number) => void;
  selectClip: (clipId: string | null) => void;
  undo: () => void;
  redo: () => void;
  reset: () => void;
}

const MAX_HISTORY = 50;

export const useTimelineStore = create<TimelineStore>()(
  persist(
    (set, get) => {
      const history: TimelineState[] = [];
      let historyIndex = -1;

      const saveHistory = () => {
        const state: TimelineState = {
          tracks: JSON.parse(JSON.stringify(get().tracks)),
          textOverlays: JSON.parse(JSON.stringify(get().textOverlays)),
          transitions: JSON.parse(JSON.stringify(get().transitions)),
          duration: get().duration,
          currentTime: get().currentTime,
          selectedClipId: get().selectedClipId,
        };
        
        historyIndex++;
        history[historyIndex] = state;
        
        if (history.length > MAX_HISTORY) {
          history.shift();
          historyIndex--;
        }
      };

      return {
        ...createDefaultTimeline(),

        addClip: (trackId, media) => {
          saveHistory();
          
          const clip: Clip = {
            id: generateId(),
            mediaId: media.id,
            media,
            startTime: 0,
            endTime: media.duration,
            trimStart: 0,
            trimEnd: media.duration,
            volume: 1,
            effects: [],
          };

          set((state) => {
            const tracks = state.tracks.map((track): Track => {
              if (track.id === trackId) {
                return { ...track, clips: [...track.clips, clip] };
              }
              return track;
            });

            const allClips = tracks.flatMap(t => t.clips);
            const duration = allClips.length > 0 
              ? Math.max(...allClips.map(c => c.endTime))
              : 0;

            return { tracks, duration };
          });
        },

        removeClip: (clipId) => {
          saveHistory();
          
          set((state) => ({
            tracks: state.tracks.map((track): Track => ({
              ...track,
              clips: track.clips.filter((c) => c.id !== clipId),
            })),
            selectedClipId: state.selectedClipId === clipId ? null : state.selectedClipId,
          }));
        },

        updateClip: (clipId, updates) => {
          set((state) => ({
            tracks: state.tracks.map((track): Track => ({
              ...track,
              clips: track.clips.map((clip) =>
                clip.id === clipId ? { ...clip, ...updates } : clip
              ),
            })),
          }));
        },

        moveClip: (clipId, trackId, newStartTime) => {
          saveHistory();
          
          set((state) => {
            let clipToMove: Clip | null = null;
            
            const tracksWithout = state.tracks.map((track): Track => {
              const clip = track.clips.find((c) => c.id === clipId);
              if (clip) {
                clipToMove = { ...clip, startTime: newStartTime };
              }
              return {
                ...track,
                clips: track.clips.filter((c) => c.id !== clipId),
              };
            });

            if (!clipToMove) return state;

            const newTracks = tracksWithout.map((track): Track => {
              if (track.id === trackId) {
                return { ...track, clips: [...track.clips, clipToMove!] };
              }
              return track;
            });

            return { tracks: newTracks };
          });
        },

        splitClip: (clipId, splitTime) => {
          saveHistory();
          
          set((state) => {
            const tracks = state.tracks.map((track): Track => {
              const clipIndex = track.clips.findIndex((c) => c.id === clipId);
              if (clipIndex === -1) return track;

              const originalClip = track.clips[clipIndex];
              const clipDuration = originalClip.endTime - originalClip.startTime;
              const splitPoint = splitTime - originalClip.startTime;
              
              if (splitPoint <= 0 || splitPoint >= clipDuration) {
                return track;
              }

              const clip1: Clip = {
                ...originalClip,
                endTime: originalClip.startTime + splitPoint,
                trimEnd: originalClip.trimStart + splitPoint,
              };

              const clip2: Clip = {
                ...originalClip,
                id: generateId(),
                startTime: originalClip.startTime + splitPoint,
                trimStart: originalClip.trimStart + splitPoint,
              };

              const newTrackClips = [...track.clips];
              newTrackClips.splice(clipIndex, 1, clip1, clip2);
              
              return { ...track, clips: newTrackClips };
            });

            return { tracks };
          });
        },

        addTextOverlay: (overlay) => {
          saveHistory();
          
          const newOverlay: TextOverlay = {
            ...overlay,
            id: generateId(),
          };
          
          set((state) => ({
            textOverlays: [...state.textOverlays, newOverlay],
          }));
        },

        removeTextOverlay: (id) => {
          saveHistory();
          
          set((state) => ({
            textOverlays: state.textOverlays.filter((o) => o.id !== id),
          }));
        },

        updateTextOverlay: (id, updates) => {
          set((state) => ({
            textOverlays: state.textOverlays.map((overlay) =>
              overlay.id === id ? { ...overlay, ...updates } : overlay
            ),
          }));
        },

        setCurrentTime: (time) => set({ currentTime: time }),
        
        selectClip: (clipId) => set({ selectedClipId: clipId }),

        undo: () => {
          if (historyIndex <= 0) return;
          
          historyIndex--;
          const prevState = history[historyIndex];
          
          set({
            tracks: prevState.tracks,
            textOverlays: prevState.textOverlays,
            transitions: prevState.transitions,
            duration: prevState.duration,
            currentTime: prevState.currentTime,
            selectedClipId: prevState.selectedClipId,
          });
        },

        redo: () => {
          if (historyIndex >= history.length - 1) return;
          
          historyIndex++;
          const nextState = history[historyIndex];
          
          set({
            tracks: nextState.tracks,
            textOverlays: nextState.textOverlays,
            transitions: nextState.transitions,
            duration: nextState.duration,
            currentTime: nextState.currentTime,
            selectedClipId: nextState.selectedClipId,
          });
        },

        reset: () => set(createDefaultTimeline()),
      };
    },
    {
      name: 'reelforge-timeline',
    }
  )
);
