import sys
from rembg import remove, new_session
from PIL import Image
s=new_session('isnet-general-use')
for n in sys.argv[1:]:
    im=Image.open(f'raw/{n}.jpg').convert('RGB')
    out=remove(im,session=s,alpha_matting=False,post_process_mask=True)
    bb=out.getchannel('A').point(lambda v:255 if v>8 else 0).getbbox()
    out=out.crop(bb); out.save(f'cut/{n}.png'); print(n,out.size)
