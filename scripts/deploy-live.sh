#!/usr/bin/env bash
# 构建并上线。
#
# 内容落在 $DEPLOY_ROOT/live/，刻意放在站点根目录之外 —— 那里还留着旧站，
# 是回滚用的：nginx 的 root 指到 live/，改回去就是一条指令的事。旧站的
# build.sh 会 rm -rf 它自己的根目录，所以新站绝不能放在那下面。
#
# 替换是原子的：先传到 live.new，再一次 mv 换过去，访客不会看到半个站。
#
# 部署目标从环境变量来，不写死在公开仓库里。本地放一份 .env.deploy
# （见 .env.deploy.example，已在 .gitignore 里）。
set -euo pipefail

cd "$(dirname "$0")/.."
[ -f .env.deploy ] && . ./.env.deploy

: "${DEPLOY_HOST:?DEPLOY_HOST is not set — copy .env.deploy.example to .env.deploy}"
: "${DEPLOY_KEY:?DEPLOY_KEY is not set — copy .env.deploy.example to .env.deploy}"
DEPLOY_ROOT=${DEPLOY_ROOT:-/www/staging}
DEPLOY_URL=${DEPLOY_URL:-https://www.oscommunity.cn}

# DEPLOY_ROOT 会出现在远端的 rm -rf 里，绝对路径是硬要求。
# 空值或相对路径配上 root 就是一条毁机器的命令。
case "$DEPLOY_ROOT" in
  /?*) ;;
  *) echo "DEPLOY_ROOT must be an absolute path, got '$DEPLOY_ROOT'" >&2; exit 1 ;;
esac

echo "── building ──"
pnpm build 2>&1 | tail -3

echo "── uploading to $DEPLOY_HOST:$DEPLOY_ROOT/live ──"
tar czf /tmp/live.tgz -C dist .
ssh -i "$DEPLOY_KEY" "$DEPLOY_HOST" 'cat > /tmp/live.tgz' < /tmp/live.tgz

# 远端脚本走 stdin，变量在**本地**展开后再送过去。
# 之前写成 ssh host '...${DEPLOY_ROOT}...'：单引号不展开，远端也没有这个
# 变量，于是变成 rm -rf /live.new —— 还是 root。所以这里 set -u 再兜一道。
ssh -i "$DEPLOY_KEY" "$DEPLOY_HOST" bash -s <<EOF
set -euo pipefail
ROOT='$DEPLOY_ROOT'
rm -rf "\$ROOT/live.new"
mkdir -p "\$ROOT/live.new"
tar xzf /tmp/live.tgz -C "\$ROOT/live.new"
rm -f /tmp/live.tgz
chown -R www:www "\$ROOT/live.new"
test -f "\$ROOT/live.new/index.html"          # 传坏了就别换
rm -rf "\$ROOT/live.old"
[ -d "\$ROOT/live" ] && mv "\$ROOT/live" "\$ROOT/live.old"
mv "\$ROOT/live.new" "\$ROOT/live"
rm -rf "\$ROOT/live.old"
EOF
rm -f /tmp/live.tgz

echo "── verifying ──"
for p in / /playground/ /blog/; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "$DEPLOY_URL$p")
  echo "  $code  $p"
done
echo "── live ──"
