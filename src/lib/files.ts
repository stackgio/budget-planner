/** Hands a generated file to the person: download, share sheet, or the Artifact viewer's save prompt. */
import { IS_ARTIFACT } from '../platform';
import { artifactDownload } from './cloud';

/** Returns a message to show when saving isn't possible here, otherwise null. */
export async function deliverFile(name: string, mime: string, content: string, share: boolean): Promise<string | null> {
  if (IS_ARTIFACT) {
    const r = await artifactDownload(name, content);
    return r === 'unavailable' ? 'Saving files isn\'t available in this view. Open the app in claude.ai and try again.' : null;
  }
  const blob = new Blob([content], { type: mime });
  if (share) {
    const file = new File([blob], name, { type: mime });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: name });
      return null;
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return null;
}
