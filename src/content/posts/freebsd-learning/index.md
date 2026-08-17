---
title: "FreeBSD on ARM 学习记录"
date: 2024-08-14T22:01:53+08:00
tags:
- Operating systems
- Unix
- BSD
- FreeBSD
- Cross Compiling
---

# 在Linux下尝试交叉编译FreeBSD

https://github.com/freebsd/freebsd-src/actions/runs/10380443281/job/28740282502?pr=1382

https://github.com/freebsd/freebsd-src/actions/runs/10380443281/workflow?pr=1382

https://wiki.freebsd.org/arm/crossbuild

本机环境：Ubuntu 22.04.4 LTS x86_64, Intel i7-10875H, 6.8.0-40-generic


```bash
sudo apt install bmake libarchive-dev clang-14 lld-14

# freebsd-src at ./src

export BASEDIR=$(pwd)
export MAKEOBJDIRPREFIX=$BASEDIR/obj

# create obj directory if not exists
mkdir -p $MAKEOBJDIRPREFIX

if [ -n "/usr/lib/llvm-14/bin" ]; then
    export EXTRA_BUILD_ARGS=--cross-bindir=/usr/lib/llvm-14/bin
    echo "FOUND LLVM14"
fi

export NPROC=16
export KERNCONF=GENERIC
export TARGET=arm64
export TARGET_ARCH=aarch64

export DESTDIR=$BASEDIR/destdir
# create destdir if not exists
mkdir -p $DESTDIR

cd $BASEDIR/src

./tools/build/make.py --debug $EXTRA_BUILD_ARGS TARGET=$TARGET TARGET_ARCH=$TARGET_ARCH -n
./tools/build/make.py --debug $EXTRA_BUILD_ARGS TARGET=$TARGET TARGET_ARCH=$TARGET_ARCH \
    kernel-toolchain -j$NPROC -DWITH_DISK_IMAGE_TOOLS_BOOTSTRAP -s
./tools/build/make.py --debug $EXTRA_BUILD_ARGS TARGET=$TARGET TARGET_ARCH=$TARGET_ARCH \
    KERNCONF=$KERNCONF buildkernel -j$NPROC $EXTRA_MAKE_ARGS -s
./tools/build/make.py --debug $EXTRA_BUILD_ARGS TARGET=$TARGET TARGET_ARCH=$TARGET_ARCH \
    KERNCONF=$KERNCONF installkernel -j$NPROC $EXTRA_MAKE_ARGS -s

# # buildworld now
# ./tools/build/make.py --debug $EXTRA_BUILD_ARGS TARGET=$TARGET TARGET_ARCH=$TARGET_ARCH \
#     -s buildworld -j$NPROC $EXTRA_MAKE_ARGS -s


# # installworld now
# ./tools/build/make.py --debug $EXTRA_BUILD_ARGS TARGET=$TARGET TARGET_ARCH=$TARGET_ARCH \
#     -s installworld -j$NPROC $EXTRA_MAKE_ARGS DESTDIR=$DESTDIR -s
# # installkernel now
# ./tools/build/make.py --debug $EXTRA_BUILD_ARGS TARGET=$TARGET TARGET_ARCH=$TARGET_ARCH \
#     KERNCONF=$KERNCONF installkernel -j$NPROC $EXTRA_MAKE_ARGS DESTDIR=$DESTDIR -s

# # pack
# tar -C $DESTDIR -cf $BASEDIR/FreeBSD-arm64.tar .
# gzip $BASEDIR/FreeBSD-arm64.tar -f

# copy kernel to obj directory
cp $MAKEOBJDIRPREFIX$BASEDIR/src/$TARGET.$TARGET_ARCH/sys/$KERNCONF/kernel $MAKEOBJDIRPREFIX
cp $MAKEOBJDIRPREFIX$BASEDIR/src/$TARGET.$TARGET_ARCH/sys/$KERNCONF/kernel.debug $MAKEOBJDIRPREFIX
cp $MAKEOBJDIRPREFIX$BASEDIR/src/$TARGET.$TARGET_ARCH/sys/$KERNCONF/kernel.full $MAKEOBJDIRPREFIX

file $MAKEOBJDIRPREFIX/kernel

READELF=aarch64-linux-gnu-readelf
$READELF -h $MAKEOBJDIRPREFIX/kernel
# then show sections
# $READELF -S $MAKEOBJDIRPREFIX/kernel

OBJDUMP=aarch64-linux-gnu-objdump
# $OBJDUMP -d $MAKEOBJDIRPREFIX/kernel > $MAKEOBJDIRPREFIX/kernel.S
# $OBJDUMP -S $MAKEOBJDIRPREFIX/kernel > $MAKEOBJDIRPREFIX/kernel_ws.S

echo "Done building FreeBSD for arm64(wheatfox enkerewpo@hotmail.com)"
echo "Now is " $(date)
```

# 在FreeBSD原生环境中（x64）交叉编译ARM FreeBSD

```bash
root@bsd:~ # uname -a
FreeBSD bsd 13.0-RELEASE-p8 FreeBSD 13.0-RELEASE-p8 #0: Tue Mar 15 09:36:28 UTC 2022     root@amd64-builder.daemonology.net:/usr/obj/usr/src/amd64.amd64/sys/GENERIC  amd64
```
https://wiki.freebsd.org/arm/crossbuild

https://docs.freebsd.org/en/books/developers-handbook/kernelbuild/

阿里云默认用的13-RELEASE，试着升级一下。

```sh
freebsd-version
freebsd-update fetch
freebsd-update install
pkg update && pkg upgrade
freebsd-update -r 14.0-RELEASE upgrade
freebsd-update install

reboot
freebsd-update install

pkg-static install -f pkg
pkg update
pkg upgrade

/usr/sbin/freebsd-update install
reboot

root@bsd:~ # neofetch 
```                        `       root@bsd 
  ` `.....---.......--.```   -/    -------- 
  +o   .--`         /y:`      +.   OS: FreeBSD 14.0-RELEASE-p9 amd64 
   yo`:.            :o      `+-    Uptime: 3 mins 
    y/               -/`   -o/     Packages: 209 (pkg) 
   .-                  ::/sy+:.    Shell: csh tcsh 6.22.04 
   /                     `--  /    Terminal: /dev/pts/0 
  `:                          :`   CPU: Intel Xeon Platinum (2) @ 2.499GHz 
  `:                          :`   GPU: GD 5446 
   /                          /    Memory: 409MiB / 1934MiB 
   .-                        -.
    --                      -.                             
     `:`                  `:`                              
       .--             `--.
          .---.....----.

root@bsd:~ # 

```

升级完成，这样pkg安装vim程序就不会出现linkder找不到14版本的so的问题。接下来试着交叉编译：

```bash
make: "/root/src/Makefile" line 396: check your date/time: Sat Aug 24 08:42:38 CST 2024

ntpdate pool.ntp.org
```

出现报错/usr/include/c++/v1/string:561:10: fatal error: '__string/char_traits.h' file not found - #include <__string/char_traits.h>

https://bugs.freebsd.org/bugzilla/show_bug.cgi?id=273661

(In reply to Michael Osipov from comment #4)
Sensible approach, I assume that's the way to fix it properly.

For those who are hit by this bug and don't want to search for install media, extract tarballs etc., here's a another, simpler approach that seems to work just as well. I can confirm that Clang is usable as I compiled GROMACS (C++) with several different CMake configurations just to verify that.

Assuming machine can access the internet, as root do the following:

```sh
cd /usr/include/c++/v1
mkdir __string
cd __string
fetch https://raw.githubusercontent.com/freebsd/freebsd-src/releng/14.0/contrib/llvm-project/libcxx/include/__string/char_traits.h
fetch https://raw.githubusercontent.com/freebsd/freebsd-src/releng/14.0/contrib/llvm-project/libcxx/include/__string/extern_template_lists.h
```

看起来是从13到14升级时patch的一个bug，根据上面的方法添加对应的headers之后没有报错了。

创建swap：

```sh
dd if=/dev/zero of=/root/swap1  bs=1m count=4096
chmod 0600 /root/swap1
vim /etc/rc.conf
# swapfile=”/root/swap1″
mdconfig -a -t vnode -f /root/swap1 -u 0 && swapon /dev/md0
```

更换默认的shell为zsh：

```sh
pkg install zsh
chsh -s /usr/local/bin/zsh root
pkg install ohmyzsh
cp /usr/local/share/ohmyzsh/templates/zshrc.zsh-template ~/.zshrc
pkg install powerline-fonts zsh-autosuggestions zsh-syntax-highlighting

=====
Message from zsh-syntax-highlighting-0.8.0,1:
--
Add the line below to *the end of* your .zshrc to enable highlighting.

source /usr/local/share/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh
=====
Message from zsh-autosuggestions-0.7.0:
--
Add the line below to your .zshrc to enable auto suggestions.
source /usr/local/share/zsh-autosuggestions/zsh-autosuggestions.zsh
```

https://blog.logrocket.com/configuring-vim-rust-development/
https://github.com/junegunn/vim-plug

配置vim，听所neovim在FreeBSD的支持有些问题，暂时用原生的vim9：

```sh
pkg install rust-analyzer

git clone https://github.com/github/copilot.vim.git \
    ~/.vim/pack/github/start/copilot.vim
# :Copilot setup

curl -fLo ~/.vim/autoload/plug.vim --create-dirs \
    https://raw.githubusercontent.com/junegunn/vim-plug/master/plug.vim
```

配置cgit on FreeBSD:

https://farrokhi.net/posts/2020/03/setting-up-cgit--nginx-on-freebsd/

编译FreeBSD Kernel+Apps：

```sh
export BASEDIR=$(pwd)
export MAKEOBJDIRPREFIX=$BASEDIR/obj
cd $BASEDIR/src
make -j4 buildworld TARGET_ARCH=armv7 WITHOUT_CLEAN=YES
make -j4 buildkernel TARGET_ARCH=armv7 KERNCONF=GENERIC WITHOUT_CLEAN=YES
sudo -E make installworld TARGET_ARCH=armv7 DESTDIR=$BASEDIR/nfsroot
sudo -E make distribution TARGET_ARCH=armv7 DESTDIR=$BASEDIR/nfsroot
sudo -E make installkernel TARGET_ARCH=armv7 KERNCONF=GENERIC DESTDIR=$BASEDIR/nfsroot
echo "OK"
```