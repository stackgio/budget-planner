# signs-doing-better — narration changes that need a new recording

v03 uses the original ElevenLabs voiceover untouched (42.1 s). These requested
changes cannot be made without new audio:

| Line | Current (spoken) | Requested |
|---|---|---|
| L1–L2 | "Think you’re behind financially? You might actually be doing better than you think." | "You might be doing better with money than you think." |
| L11 | "I didn’t start taking my finances seriously until I was 21." | "I didn’t start taking money seriously until I was 21." |
| new L14 | — (shown on screen only in v03) | "Which one are you working on right now?" |

Suggested tighter full script (~34–37 s at the same pace):

1. You might be doing better with money than you think. Here are 3 signs.
2. First, you’re investing, even if it’s just five dollars at a time. You’re building a habit for your future.
3. Second, you’re avoiding high-interest debt, or actively paying it off. Credit card interest can seriously slow you down.
4. Third, you’re building an emergency fund, even if you haven’t reached a thousand dollars yet. That money could keep an unexpected bill from becoming debt.
5. And bonus, you’re not spending money just to look rich.
6. I didn’t start taking money seriously until I was 21. So if you’re not doing these things yet, don’t feel behind. You can start today.
7. Which one are you working on right now?

After recording:
```
python3 scripts/voice.py ingest signs-doing-better new.mp3 --replace
# align (ElevenLabs key) or local PocketSphinx alignment, update SCRIPT lines, then:
bash scripts/motion/render.sh signs-doing-better public/voice/signs-doing-better/props.json
```
Scenes and every animation re-time from the new cues automatically.
