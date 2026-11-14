#!/usr/bin/env bash
# Keep Daily Money Motion history continuous across per-episode branches.
#   start  : fetch the base branch and every dmm/YYYY-MM-DD episode branch; check out
#            dmm-base at the base branch and merge in the latest episode branch if the
#            base doesn't already contain it (so production-log.json, research notes
#            and episode folders from the previous run are present before `dmm.mjs new`).
#   finish : after the episode branch is pushed, carry it into the base branch
#            (fast-forward when possible, otherwise a normal merge) so the next run
#            starts from the newest history even if a branch is never merged by hand.
# Never force-pushes, never deletes branches, never rewrites history.
# Usage: bash daily-money-motion/scripts/sync_history.sh start|finish
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
BASE=claude/daily-money-motion-4tu50i
MODE="${1:?usage: sync_history.sh start|finish}"

latest_episode() {
	git for-each-ref --format='%(refname:short)' 'refs/remotes/origin/dmm/' |
		sed -n 's#^origin/\(dmm/[0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\}\)$#\1#p' | sort | tail -1
}

case "$MODE" in
start)
	git fetch -q origin "$BASE"
	git fetch -q origin 'refs/heads/dmm/*:refs/remotes/origin/dmm/*' || true
	git checkout -q -B dmm-base "origin/$BASE"
	EP=$(latest_episode)
	if [ -n "$EP" ] && ! git merge-base --is-ancestor "origin/$EP" HEAD; then
		if git merge -q --no-edit "origin/$EP"; then
			echo "history: merged latest episode branch $EP into dmm-base"
		else
			git merge --abort || true
			echo "HISTORY WARNING: could not merge $EP (conflict). Continue from $BASE and report this." >&2
			exit 2
		fi
	else
		echo "history: base already contains the latest episode (${EP:-none})"
	fi
	;;
finish)
	CUR=$(git rev-parse --abbrev-ref HEAD)
	case "$CUR" in dmm/[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]) ;; *) echo "finish: not on an episode branch ($CUR); nothing to carry"; exit 0;; esac
	git fetch -q origin "$BASE"
	if git merge-base --is-ancestor "origin/$BASE" HEAD; then
		git push -q origin "HEAD:refs/heads/$BASE" && echo "history: base fast-forwarded to $CUR"
	else
		TMP="dmm-carry-$$"
		git checkout -q -B "$TMP" "origin/$BASE"
		if git merge -q --no-edit "$CUR"; then
			git push -q origin "HEAD:refs/heads/$BASE" && echo "history: $CUR merged into base"
		else
			git merge --abort || true
			echo "HISTORY WARNING: $CUR could not be merged into $BASE (conflict); next run's start step will merge it instead." >&2
		fi
		git checkout -q "$CUR"; git branch -q -D "$TMP"
	fi
	;;
*) echo "usage: sync_history.sh start|finish"; exit 1;;
esac
