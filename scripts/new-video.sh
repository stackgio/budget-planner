#!/usr/bin/env bash
# Scaffold a new video from the template.
#   scripts/new-video.sh roth-ira-explained RothIraExplained
# Creates src/videos/<id>/ and public/videos/<id>/, then tells you what to do next.
set -euo pipefail
cd "$(dirname "$0")/.."
id=${1:?Usage: scripts/new-video.sh <video-id> <ComponentName>}
name=${2:?Usage: scripts/new-video.sh <video-id> <ComponentName>}
dir=src/videos/$id
[[ -e $dir ]] && { echo "$dir already exists"; exit 1; }
mkdir -p "$dir" "public/videos/$id"
cp src/videos/_template/script.txt "$dir/script.txt"
sed -e "s/__NAME__/$name/g" -e "s/__VIDEO_ID__/$id/g" src/videos/_template/Video.tsx > "$dir/$name.tsx"
cat <<MSG
Created $dir/$name.tsx and $dir/script.txt

Next:
 1. Put the script in $dir/script.txt (one narration line per row).
 2. Put the ElevenLabs narration in public/videos/$id/ (narration.mp3) plus its
    alignment JSON, then run:
      node scripts/align-narration.ts --video $id --alignment public/videos/$id/alignment.json
 3. Register it in src/Root.tsx under <Folder name="Videos">:
      <Composition id="$name" component={$name} schema={${name}Schema}
        calculateMetadata={calculate${name}Metadata} durationInFrames={300} fps={30}
        width={1080} height={1920} defaultProps={{showCaptions: false, showSafeZones: false}} />
 4. npm run dev  →  build scenes  →  scripts/render.sh $name
MSG
