export const EDITING_TOOLS = {
  transitions: [
    { id: "fade", name: "Fade", description: "Smooth fade between clips", duration: 0.5 },
    { id: "crossfade", name: "Crossfade", description: "Smooth crossfade blend", duration: 0.5 },
    { id: "dissolve", name: "Dissolve", description: "Classic dissolve transition", duration: 0.5 },
    { id: "wipe_left", name: "Wipe Left", description: "Wipe from right to left", duration: 0.4 },
    { id: "wipe_right", name: "Wipe Right", description: "Wipe from left to right", duration: 0.4 },
    { id: "wipe_up", name: "Wipe Up", description: "Wipe from bottom to top", duration: 0.4 },
    { id: "wipe_down", name: "Wipe Down", description: "Wipe from top to bottom", duration: 0.4 },
    { id: "slide_left", name: "Slide Left", description: "Slide to the left", duration: 0.4 },
    { id: "slide_right", name: "Slide Right", description: "Slide to the right", duration: 0.4 },
    { id: "zoom_in", name: "Zoom In", description: "Zoom into next clip", duration: 0.5 },
    { id: "zoom_out", name: "Zoom Out", description: "Zoom out to next clip", duration: 0.5 },
    { id: "blur", name: "Blur", description: "Blur transition", duration: 0.5 },
  ],
  effects: [
    { id: "brightness", name: "Brightness", description: "Adjust brightness", range: [-1, 1] },
    { id: "contrast", name: "Contrast", description: "Adjust contrast", range: [0, 2] },
    { id: "saturation", name: "Saturation", description: "Adjust color saturation", range: [0, 2] },
    { id: "blur", name: "Blur", description: "Add blur effect", range: [0, 10] },
    { id: "sharpen", name: "Sharpen", description: "Sharpen image", range: [0, 5] },
    { id: "vignette", name: "Vignette", description: "Add vignette effect", range: [0, 1] },
    { id: "warm", name: "Warm", description: "Warm color tone" },
    { id: "cool", name: "Cool", description: "Cool color tone" },
    { id: "dramatic", name: "Dramatic", description: "High contrast dramatic look" },
    { id: "cinema", name: "Cinema", description: "Cinematic color grade" },
    { id: "vhs", name: "VHS", description: "Retro VHS effect" },
    { id: "grain", name: "Film Grain", description: "Add film grain" },
    { id: "fade_bw", name: "Fade to B&W", description: "Fade to black and white" },
  ],
  textAnimations: [
    { id: "none", name: "Static", description: "No animation" },
    { id: "fade_in", name: "Fade In", description: "Fade in animation" },
    { id: "typewriter", name: "Typewriter", description: "Typewriter effect" },
    { id: "slide_up", name: "Slide Up", description: "Slide up animation" },
    { id: "bounce", name: "Bounce", description: "Bounce animation" },
  ],
  styles: [
    { id: "viral", name: "Viral", description: "High energy, trending style" },
    { id: "cinematic", name: "Cinematic", description: "Movie-quality look" },
    { id: "fun", name: "Fun", description: "Playful and energetic" },
    { id: "educational", name: "Educational", description: "Clean professional style" },
    { id: "dramatic", name: "Dramatic", description: "Dark intense style" },
  ],
  aspectRatios: [
    { id: "9:16", name: "Vertical (9:16)", description: "TikTok, Reels, Shorts" },
    { id: "16:9", name: "Horizontal (16:9)", description: "YouTube, TV" },
    { id: "1:1", name: "Square (1:1)", description: "Instagram feed" },
  ],
  durations: [
    { id: "15", name: "15 seconds", description: "Quick content" },
    { id: "30", name: "30 seconds", description: "Standard reel" },
    { id: "60", name: "60 seconds", description: "Long form" },
  ],
};

export function getToolDescription(): string {
  const tools = EDITING_TOOLS;
  
  return `
## Available Editing Tools

### Transitions (use between clips)
${tools.transitions.map(t => `- ${t.name}: ${t.description}`).join('\n')}

### Effects (apply to clips)
${tools.effects.map(e => `- ${e.name}: ${e.description}`).join('\n')}

### Text Animations
${tools.textAnimations.map(t => `- ${t.name}: ${t.description}`).join('\n')}

### Video Styles
${tools.styles.map(s => `- ${s.name}: ${s.description}`).join('\n')}

### Aspect Ratios
${tools.aspectRatios.map(a => `- ${a.name}: ${a.description}`).join('\n')}

### Target Durations
${tools.durations.map(d => `- ${d.name}: ${d.description}`).join('\n')}
`;
}

export function validateEditingPlan(plan: object): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Basic validation
  if (!plan || typeof plan !== 'object') {
    return { valid: false, errors: ['Plan must be an object'] };
  }
  
  const planAny = plan as any;
  
  // Check required fields
  if (!planAny.clips || !Array.isArray(planAny.clips)) {
    errors.push('Missing or invalid clips array');
  }
  
  if (planAny.textOverlays && !Array.isArray(planAny.textOverlays)) {
    errors.push('textOverlays must be an array');
  }
  
  // Validate clip indices
  if (planAny.clips) {
    planAny.clips.forEach((clip: any, index: number) => {
      if (clip.sourceIndex !== undefined && clip.sourceIndex < 0) {
        errors.push(`Clip ${index}: sourceIndex must be >= 0`);
      }
      if (clip.endTime && clip.startTime && clip.endTime <= clip.startTime) {
        errors.push(`Clip ${index}: endTime must be greater than startTime`);
      }
    });
  }
  
  // Validate text overlays
  if (planAny.textOverlays) {
    planAny.textOverlays.forEach((text: any, index: number) => {
      if (!text.text) {
        errors.push(`Text overlay ${index}: text is required`);
      }
      if (text.endTime && text.startTime && text.endTime <= text.startTime) {
        errors.push(`Text overlay ${index}: endTime must be greater than startTime`);
      }
    });
  }
  
  return { valid: errors.length === 0, errors };
}
