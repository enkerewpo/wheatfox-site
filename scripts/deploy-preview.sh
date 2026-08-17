#!/usr/bin/env bash
# 构建并部署到 https://www.oscommunity.cn/preview/
#
# 内容落在 /www/staging/preview/ —— 站点根目录之外，
# 因为旧站的 blog/build.sh 会 rm -rf 站点根目录。
set -euo pipefail

KEY=${RBNX_SSH_KEY:-/Users/wheatfox/Music/sshkey/wheatfox_key}
HOST=root@www.oscommunity.cn
cd "$(dirname "$0")/.."

echo "── building (base=/preview/) ──"
BASE=/preview/ pnpm build 2>&1 | tail -3

echo "── uploading ──"
tar czf /tmp/preview.tgz -C dist . 2>/dev/null
ssh -i "$KEY" "$HOST" 'cat > /tmp/preview.tgz' < /tmp/preview.tgz
ssh -i "$KEY" "$HOST" '
  rm -rf /www/staging/preview.new
  mkdir -p /www/staging/preview.new
  tar xzf /tmp/preview.tgz -C /www/staging/preview.new 2>/dev/null
  rm -f /tmp/preview.tgz
  chown -R www:www /www/staging/preview.new
  # 原子替换，避免上传途中访客看到半个站
  rm -rf /www/staging/preview.old
  [ -d /www/staging/preview ] && mv /www/staging/preview /www/staging/preview.old
  mv /www/staging/preview.new /www/staging/preview
  rm -rf /www/staging/preview.old
'
rm -f /tmp/preview.tgz

echo "── verifying ──"
R=www.oscommunity.cn:443:47.94.74.133
printf "  production  %s\n" "$(curl -sS -o /dev/null -w '%{http_code}' --resolve $R https://www.oscommunity.cn/ --max-time 25)"
for u in /preview/ /preview/playground/; do
  printf "  %-22s %s\n" "$u" "$(curl -sS -o /dev/null -w '%{http_code}' --resolve $R "https://www.oscommunity.cn$u" --max-time 25)"
done
echo "→ https://www.oscommunity.cn/preview/playground/"
