# Forced alignment of the supplied narration against the exact script (pocketsphinx, offline).
# Usage: python -I tools/align.py narration_16k_mono.raw > tools/timings.json
import json, sys
from pocketsphinx import Decoder
SCRIPT = ("you wake up one day and someone offers you two choices "
          "option a go back ten years with everything you know today "
          "every lesson every mistake every opportunity you missed you remember it all "
          "option b take ten million dollars cash right now and keep your life exactly where it is "
          "you can't choose both "
          "are you taking the money or turning back the clock "
          "a or b and why")
d = Decoder(samprate=16000, bestpath=False)
d.set_align_text(SCRIPT)
raw = open(sys.argv[1], "rb").read()
d.start_utt(); d.process_raw(raw, full_utt=True); d.end_utt()
fr = 100  # pocketsphinx frames per second
words = [dict(w=s.word, s=round(s.start_frame / fr, 2), e=round((s.end_frame + 1) / fr, 2))
         for s in d.seg() if s.word not in ("<s>", "</s>", "<sil>")]
json.dump(words, sys.stdout, indent=0)
