#!/usr/bin/env bash
# 构建并上线到 https://www.oscommunity.cn/
#
# 内容落在 /www/staging/live/ —— **不是** /www/wwwroot/www.oscommunity.cn。
# 那个目录还留着旧的 Hexo 站，是回滚用的：nginx 的 root 指到这里，
# 改回去就是一条 root 指令的事。旧站的 blog/build.sh 会 rm -rf 它自己的
# 根目录，所以新站绝不能放在那下面。
#
# 替换是原子的：先上传到 live.new，再一次 mv 换过去，
# 访客不会看到半个站。
set -euo pipefail

KEY=${RBNX_SSH_KEY:-/Users/wheatfox/Music/sshkey/wheatfox_key}
HOST=root@www.oscommunity.cn
cd "$(dirname "$0")/.."

echo "── building ──"
pnpm build 2>&1 | tail -3

echo "── uploading ──"
tar czf /tmp/live.tgz -C dist .
ssh -i "$KEY" "$HOST" 'cat > /tmp/live.tgz' < /tmp/live.tgz
ssh -i "$KEY" "$HOST" '
  set -e
  rm -rf /www/staging/live.new
  mkdir -p /www/staging/live.new
  tar xzf /tmp/live.tgz -C /www/staging/live.new
  rm -f /tmp/live.tgz
  chown -R www:www /www/staging/live.new
  test -f /www/staging/live.new/index.html   # 上传坏了就别换
  rm -rf /www/staging/live.old
  [ -d /www/staging/live ] && mv /www/staging/live /www/staging/live.old
  mv /www/staging/live.new /www/staging/live
  rm -rf /www/staging/live.old
'
rm -f /tmp/live.tgz

echo "── verifying ──"
for p in / /playground/ /blog/; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "https://www.oscommunity.cn$p")
  echo "  $code  $p"
done
echo "── live ──"
