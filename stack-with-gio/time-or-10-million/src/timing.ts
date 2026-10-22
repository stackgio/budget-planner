// Cue frames (30 fps) taken from forced alignment of public/narration.mp3 against the script
// (tools/align.py -> tools/timings.json), cross-checked against ffmpeg silencedetect pauses.
// Seconds in comments are word onsets.
export const CUE = {
  start: 0,
  optionA: 100, // pause 3.05–3.46, "Option A" 3.43
  goBack: 134, // "go back" 4.45
  tenYears: 146, // "ten years" 4.88
  withEverything: 167, // "with everything" 5.56
  everything: 176, // 5.86
  know: 192, // "know" 6.41
  lesson: 218, // "every lesson" 7.29
  mistake: 246, // "every mistake" 8.24
  opportunity: 277, // "every opportunity" 9.29
  rememberAll: 330, // "you remember it all" 11.07
  optionB: 378, // pause 12.13–12.67, "Option B" 12.66
  tenMillion: 417, // "ten million dollars" 13.91
  cash: 443, // "cash right now" 14.76
  keepLife: 475, // "and keep your life" 15.83
  life: 491, // 16.36
  cant: 549, // "can't" 18.30
  both: 565, // "both" 18.84
  areYou: 586, // pause 19.25–19.63, "are you" 19.61
  money: 594, // "taking the money" 19.80
  clock: 627, // "turning back the clock" 20.90
  aOrB: 664, // pause 21.86–22.25, "A or B" 22.23
  why: 706, // "why" 23.54
  voiceEnd: 717, // last word ends 23.91
};

export const DURATION = 750; // 25.0 s: narration + ~1 s hold on the final composition
