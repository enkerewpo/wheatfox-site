---
title: "Linux Kernel Library (LKL) 实践指南"
date: 2026-01-13T19:59:03+08:00
tags:
- Operating systems
- Linux
- Linux Kernel Library
- LKL
---

wheatfox

```bash
git clone https://github.com/lkl/linux.git
cd linux
cd tools/lkl
make
```

之后可以在 `tools/lkl/lib` 找到 `liblkl.so`，对应的 install headers 位于 `tools/lkl/include`。上面的 make 也会编译一些基本的 lkl 测试程序：

```bash
cd tools/lkl/tests
./boot
```

`boot.c` 源码如下，其会对基本的 syscall 函数进行测试：

```c
/* part of tools/lkl/tests/boot.c */
#define CMD_LINE "mem=32M loglevel=8 " KASAN_CMD_LINE LKL_MMU_TEST_CMD_LINE

static int lkl_test_start_kernel(void)
{
	int ret;
	ret = lkl_start_kernel(CMD_LINE);
	boot_log = lkl_test_get_log();
	return ret == 0 ? TEST_SUCCESS : TEST_FAILURE;
}

LKL_TEST_CALL(stop_kernel, lkl_sys_halt, 0);

struct lkl_test tests[] = {
	LKL_TEST(mutex),
	LKL_TEST(semaphore),
	LKL_TEST(join),
	LKL_TEST(start_kernel),
#ifdef LKL_CONFIG_KASAN_KUNIT_TEST
	LKL_TEST(kasan),
#endif
	LKL_TEST(getpid),
	LKL_TEST(syscall_latency),
	LKL_TEST(umask),
	LKL_TEST(umask2),
	LKL_TEST(creat),
	LKL_TEST(close),
	LKL_TEST(failopen),
	LKL_TEST(open),
	LKL_TEST(write),
	LKL_TEST(lseek_cur),
	LKL_TEST(lseek_end),
	LKL_TEST(lseek_set),
	LKL_TEST(read),
	LKL_TEST(fstat),
	LKL_TEST(mkdir),
	LKL_TEST(stat),
#ifndef __MINGW32__
	LKL_TEST(nanosleep),
#endif
	LKL_TEST(pipe2),
	LKL_TEST(epoll),
	LKL_TEST(mount_fs_proc),
	LKL_TEST(chdir_proc),
	LKL_TEST(open_cwd),
	LKL_TEST(getdents64),
	LKL_TEST(close_dir_fd),
	LKL_TEST(chdir_root),
    /* ... */
	LKL_TEST(stop_kernel),
};

int main(int argc, const char **argv)
{
	int ret;
	lkl_host_ops.print = lkl_test_log;
	if (lkl_init(&lkl_host_ops) < 0) {
		printf("%s\n", lkl_test_get_log());
		return 1;
	}
	ret = lkl_test_run(tests, sizeof(tests)/sizeof(struct lkl_test),
			"boot");
	lkl_cleanup();
	return ret;
}
```

输出如下：
```
➜  tests git:(master) ✗ ./boot                      
1..35 # boot
* 1 mutex
ok 1 mutex
 ---
 time_us: 4
 log: |
 ...
* 2 semaphore
ok 2 semaphore
 ---
 time_us: 2
 log: |
 ...
* 3 join
ok 3 join
 ---
 time_us: 58
 log: |
  joined 140146709055168
 ...
* 4 start_kernel
ok 4 start_kernel
 ---
 time_us: 42898
 log: |
  [    0.000000] Linux version 6.6.0+ (wheatfox@dedsec-amd0) (gcc (Debian 14.2.0-19) 14.2.0, GNU ld (GNU Binutils for Debian) 2.44) #3 Tue Jan 13 20:40:53 CST 2026
  [    0.000000] memblock address range: 0x7f7670400000 - 0x7f7672400000
  [    0.000000] Zone ranges:
  [    0.000000]   Normal   [mem 0x00007f7670400000-0x00007f76723fffff]
  [    0.000000] Movable zone start for each node
  [    0.000000] Early memory node ranges
  [    0.000000]   node   0: [mem 0x00007f7670400000-0x00007f76723fffff]
  [    0.000000] Initmem setup node 0 [mem 0x00007f7670400000-0x00007f76723fffff]
  [    0.000000] pcpu-alloc: s0 r0 d32768 u32768 alloc=1*32768
  [    0.000000] pcpu-alloc: [0] 0 
  [    0.000000] Kernel command line:  mem=32M loglevel=8 
  [    0.000000] Dentry cache hash table entries: 4096 (order: 3, 32768 bytes, linear)
  [    0.000000] Inode-cache hash table entries: 2048 (order: 2, 16384 bytes, linear)
  [    0.000000] Built 1 zonelists, mobility grouping on.  Total pages: 8080
  [    0.000000] mem auto-init: stack:all(zero), heap alloc:off, heap free:off
  [    0.000000] Memory: 32232K/32768K available (6499K kernel code, 1733K rwdata, 1519K rodata, 118K init, 340K bss, 536K reserved, 0K cma-reserved)
  [    0.000000] SLUB: HWalign=32, Order=0-3, MinObjects=0, CPUs=1, Nodes=1
  [    0.000000] NR_IRQS: 4096
  [    0.000000] lkl: irqs initialized
  [    0.000000] clocksource: lkl: mask: 0xffffffffffffffff max_cycles: 0x1cd42e4dffb, max_idle_ns: 881590591483 ns
  [    0.000000] lkl: time and timers initialized (irq1)
  [    0.000013] pid_max: default: 4096 minimum: 301
  [    0.000047] Mount-cache hash table entries: 512 (order: 0, 4096 bytes, linear)
  [    0.000049] Mountpoint-cache hash table entries: 512 (order: 0, 4096 bytes, linear)
  [    0.001633] printk: console [lkl_console0] enabled
  [    0.001644] clocksource: jiffies: mask: 0xffffffff max_cycles: 0xffffffff, max_idle_ns: 19112604462750000 ns
  [    0.001683] NET: Registered PF_NETLINK/PF_ROUTE protocol family
  [    0.001707] lkl_pci: probe of lkl_pci failed with error -1
  [    0.010328] raid6: skipped pq benchmark and selected int64x8
  [    0.010329] raid6: using intx1 recovery algorithm
  [    0.010423] vgaarb: loaded
  [    0.010431] clocksource: Switched to clocksource lkl
  [    0.010494] NET: Registered PF_INET protocol family
  [    0.010516] IP idents hash table entries: 2048 (order: 2, 16384 bytes, linear)
  [    0.010557] tcp_listen_portaddr_hash hash table entries: 512 (order: 0, 4096 bytes, linear)
  [    0.010558] Table-perturb hash table entries: 65536 (order: 6, 262144 bytes, linear)
  [    0.010560] TCP established hash table entries: 512 (order: 0, 4096 bytes, linear)
  [    0.010563] TCP bind hash table entries: 512 (order: 1, 8192 bytes, linear)
  [    0.010566] TCP: Hash tables configured (established 512 bind 512)
  [    0.010574] UDP hash table entries: 128 (order: 0, 4096 bytes, linear)
  [    0.010575] UDP-Lite hash table entries: 128 (order: 0, 4096 bytes, linear)
  [    0.010586] PCI: CLS 0 bytes, default 32
  [    0.010730] workingset: timestamp_bits=62 max_order=13 bucket_order=0
  [    0.010785] SGI XFS with ACLs, security attributes, no debug enabled
  [    0.010886] xor: automatically using best checksumming function   8regs     
  [    0.010889] io scheduler mq-deadline registered
  [    0.010890] io scheduler kyber registered
  [    0.012199] NET: Registered PF_INET6 protocol family
  [    0.012853] Segment Routing with IPv6
  [    0.012858] In-situ OAM (IOAM) with IPv6
  [    0.012866] sit: IPv6, IPv4 and MPLS over IPv4 tunneling driver
  [    0.013625] Btrfs loaded, zoned=no, fsverity=no
  [    0.013675] Warning: unable to open an initial console.
  [    0.013676] This architecture does not have kernel memory protection.
  [    0.013677] Run /init as init process
  [    0.013678]   with arguments:
  [    0.013678]     /init
  [    0.013679]   with environment:
  [    0.013679]     HOME=/
  [    0.013680]     TERM=linux
 ...
* 5 getpid
ok 5 getpid
 ---
 time_us: 6
 log: |
  lkl_sys_getpid() = 1 
 ...
* 6 syscall_latency
ok 6 syscall_latency
 ---
 time_us: 232
 log: |
  avg/min/max: lkl:43/40/130 native:141/130/1240
 ...
* 7 umask
ok 7 umask
 ---
 time_us: 1
 log: |
  lkl_sys_umask(0777) = 18 
 ...
[skipping some output]
 ...
* 34 new_tgid_threads
ok 34 new_tgid_threads
 ---
 time_us: 1650
 log: |
 ...
* 35 stop_kernel
ok 35 stop_kernel
 ---
 time_us: 426
 log: |
  [    0.104592] reboot: Restarting system
  lkl_sys_halt() = 0 
 ...
```