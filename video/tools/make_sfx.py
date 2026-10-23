"""Procedurally synthesized SFX kit (no external samples). 48 kHz mono WAV."""
import numpy as np, wave, os, sys
SR=48000; out=sys.argv[1]; os.makedirs(out,exist_ok=True)
rng=np.random.default_rng(7)
def save(n,x,peak=0.9):
    x=x/ (np.abs(x).max()+1e-9)*peak
    w=wave.open(f'{out}/{n}.wav','wb');w.setnchannels(1);w.setsampwidth(2);w.setframerate(SR)
    w.writeframes((x*32767).astype(np.int16).tobytes());w.close()
def t(d): return np.arange(int(SR*d))/SR
def lp(x,a):  # one-pole lowpass, a in 0..1 (array or scalar)
    y=np.zeros_like(x);s=0.0;a=np.broadcast_to(a,x.shape)
    for i in range(len(x)): s+=a[i]*(x[i]-s);y[i]=s
    return y
def env(n,att,rel):
    tt=np.arange(n)/SR; return np.minimum(1,tt/att)*np.exp(-np.maximum(0,tt-att)/rel)
# whoosh: band-swept noise, swell then fade
d=0.55;n=int(SR*d);tt=t(d);x=rng.standard_normal(n)
cut=0.02+0.25*np.sin(np.pi*tt/d)**2
y=lp(x,cut)-lp(x,cut*0.15); e=np.sin(np.pi*np.clip(tt/d,0,1))**1.6
save('whoosh',y*e)
# soft whoosh short
d=0.32;n=int(SR*d);tt=t(d);x=rng.standard_normal(n);cut=0.03+0.18*np.sin(np.pi*tt/d)**2
save('whoosh_short',(lp(x,cut)-lp(x,cut*0.2))*np.sin(np.pi*tt/d)**2)
# impact: low sine drop + noise click
d=0.7;tt=t(d);f=90*np.exp(-tt*6)+38;ph=2*np.pi*np.cumsum(f)/SR
y=np.sin(ph)*np.exp(-tt*5.5)+0.25*lp(rng.standard_normal(len(tt)),0.08)*np.exp(-tt*30)
save('impact',y)
# stamp thud: shorter, papery
d=0.35;tt=t(d);ph=2*np.pi*np.cumsum(140*np.exp(-tt*20)+60)/SR
y=0.8*np.sin(ph)*np.exp(-tt*14)+0.6*lp(rng.standard_normal(len(tt)),0.3)*np.exp(-tt*45)
save('stamp',y)
# snap/break: bright noise burst + tiny crackles
d=0.3;tt=t(d);x=rng.standard_normal(len(tt));y=(x-lp(x,0.2))*np.exp(-tt*25)
for k in range(6):
    o=int(SR*(0.01+0.035*k));y[o:o+300]+=rng.standard_normal(300)*np.exp(-np.arange(300)/60)*0.6
save('snap',y,0.7)
# pop: pitched blip
d=0.12;tt=t(d);ph=2*np.pi*np.cumsum(900*np.exp(-tt*30)+380)/SR
save('pop',np.sin(ph)*env(len(tt),0.002,0.03))
# click (cart add): two short transients
d=0.09;tt=t(d);y=np.zeros(len(tt))
for o,f0 in ((0,2400),(0.035,1800)):
    i=int(o*SR);seg=t(0.02);y[i:i+len(seg)]+=np.sin(2*np.pi*f0*seg)*np.exp(-seg*400)
save('click',y,0.8)
# tick (counter)
seg=t(0.025);save('tick',np.sin(2*np.pi*3200*seg)*np.exp(-seg*600),0.6)
# notification ding: two-tone bell
d=0.9;tt=t(d);y=np.zeros(len(tt))
for o,f0 in ((0,1318.5),(0.12,1760)):
    i=int(o*SR);s=tt[:len(tt)-i]
    b=sum(a*np.sin(2*np.pi*f0*h*s) for h,a in ((1,1),(2.76,0.25),(5.4,0.08)))*np.exp(-s*5)*np.minimum(1,s/0.003)
    y[i:]+=b
save('ding',y,0.8)
# warning: low double buzz
d=0.5;tt=t(d);sq=np.sign(np.sin(2*np.pi*220*tt));sq=lp(sq,0.08)
g=((tt%0.25)<0.17).astype(float);g=lp(g,0.01)
save('warn',sq*g*np.exp(-tt*2),0.6)
# record scratch: noise through fast-moving bandpass + pitch wobble
d=0.42;tt=t(d);x=rng.standard_normal(len(tt))
mod=0.5+0.5*np.sin(2*np.pi*(6+10*tt)*tt);cut=0.02+0.35*mod
y=lp(x,cut)-lp(x,cut*0.3);ph=2*np.pi*np.cumsum(300+600*mod)/SR
y=y*0.7+0.4*np.sin(ph)*np.sign(np.sin(ph*0.5))
save('scratch',y*np.minimum(1,tt/0.01)*np.exp(-tt*4),0.7)
# shutter: two clicks with noise
d=0.18;tt=t(d);y=np.zeros(len(tt))
for o in (0,0.07):
    i=int(o*SR);m=int(0.03*SR);y[i:i+m]+=rng.standard_normal(m)*np.exp(-np.arange(m)/(SR*0.006))
save('shutter',y-lp(y,0.1),0.7)
# success chime: soft major arpeggio
d=1.2;tt=t(d);y=np.zeros(len(tt))
for k,f0 in enumerate((659.25,830.6,987.8)):
    i=int(k*0.07*SR);s=tt[:len(tt)-i]
    y[i:]+=(np.sin(2*np.pi*f0*s)+0.2*np.sin(2*np.pi*2*f0*s))*np.exp(-s*3.5)*np.minimum(1,s/0.004)
save('chime',y,0.7)
# coin (payment leaving): short metallic ting
seg=t(0.35);save('coin',(np.sin(2*np.pi*2637*seg)+0.6*np.sin(2*np.pi*3951*seg))*np.exp(-seg*14)*np.minimum(1,seg/0.002),0.6)
# car pass (enter from right): low rumble + doppler whoosh
d=1.1;tt=t(d);x=rng.standard_normal(len(tt));cut=0.01+0.06*np.exp(-((tt-0.45)/0.25)**2)
r=lp(x,cut);ph=2*np.pi*np.cumsum(70+30*np.exp(-((tt-0.45)/0.3)**2))/SR
y=r*3+0.5*np.sin(ph)*np.exp(-((tt-0.5)/0.35)**2)
save('carpass',y*np.minimum(1,tt/0.1)*np.exp(-np.maximum(0,tt-0.6)*5))
print('ok',sorted(os.listdir(out)))
