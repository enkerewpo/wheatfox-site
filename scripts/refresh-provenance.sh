#!/usr/bin/env bash
# 从真正跑 Robonix 的那台机器上抓版本信息，写回 src/lib/lab/provenance.ts。
# 不要手写这些数字 —— 演示页上的「跑的是什么」必须和实际一致。
set -euo pipefail
HOST=${ROBONIX_HOST:-work_pc_tailscale}
REPO=${ROBONIX_REPO:-'~/robonix-lab/robonix'}

read -r COMMIT DESC DATE ARCH KERNEL HOSTNAME RUSTC PY DISTRO <<<"$(
  ssh "$HOST" "cd $REPO && printf '%s %s %s %s %s %s %s %s %s' \
    \"\$(git rev-parse --short HEAD)\" \
    \"\$(git describe --tags --always 2>/dev/null)\" \
    \"\$(git log -1 --format=%cd --date=short)\" \
    \"\$(uname -m)\" \"\$(uname -r)\" \"\$(hostname)\" \
    \"\$(rustc --version | cut -d' ' -f2)\" \
    \"\$(python3 -V | cut -d' ' -f2)\" \
    \"\$(. /etc/os-release; echo \$PRETTY_NAME | tr ' ' '_')\""
)"
echo "robonix $DESC ($COMMIT, $DATE) on $HOSTNAME — $DISTRO $ARCH"
