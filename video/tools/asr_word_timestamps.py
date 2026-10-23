import sherpa_onnx, wave, numpy as np, json
d='sherpa-onnx-zipformer-en-2023-06-26/'
import glob
def f(p): return glob.glob(d+p)[0]
rec=sherpa_onnx.OfflineRecognizer.from_transducer(encoder=f('encoder*int8.onnx'),decoder=f('decoder*.onnx') if not glob.glob(d+'decoder*int8.onnx') else f('decoder*int8.onnx'),joiner=f('joiner*int8.onnx'),tokens=d+'tokens.txt',num_threads=4,decoding_method='greedy_search')
w=wave.open('vo16k.wav');a=np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16).astype(np.float32)/32768
# chunk by ~ 10s windows at silences to keep model happy
cuts=[0,9.4,14.25,19.55,24.5,27.77,31.5,38.0]
out=[]
for s,e in zip(cuts[:-1],cuts[1:]):
  st=rec.create_stream();st.accept_waveform(16000,a[int(s*16000):int(e*16000)]);rec.decode_stream(st)
  r=st.result
  print(round(s,2),r.text)
  out.append(dict(off=s,tokens=r.tokens,ts=[t+s for t in r.timestamps]))
json.dump(out,open('tokens.json','w'))
