import sys, numpy as np
from PIL import Image
from scipy import ndimage as nd
for spec in sys.argv[1:]:
    n,frac=spec.split(':'); frac=float(frac)
    src=Image.open(f'raw/{n}.jpg').convert('RGB'); cut=Image.open(f'cut/{n}.png')
    # recompute on full image to keep alignment: redo via rembg mask stored? use cut bbox approach: find offset by template - simpler: rerun remove
    from rembg import remove,new_session
    s=new_session('isnet-general-use')
    m=np.array(remove(src,session=s,only_mask=True,post_process_mask=True)).astype(np.float32)/255
    solid=m>0.5
    holes=nd.binary_fill_holes(solid)&~solid
    lab,k=nd.label(holes); area=solid.sum()
    sizes=nd.sum(holes,lab,range(1,k+1))
    fill=np.zeros_like(solid)
    for i,sz in enumerate(sizes):
        if sz<frac*area: fill|=(lab==i+1)
    fill=nd.binary_dilation(fill,iterations=2)
    m=np.maximum(m,fill.astype(np.float32))
    a=Image.fromarray((m*255).astype(np.uint8))
    out=src.convert('RGBA'); out.putalpha(a)
    bb=a.point(lambda v:255 if v>8 else 0).getbbox(); out=out.crop(bb); out.save(f'cut/{n}.png'); print(n,k,out.size)
