---
title: "【论文笔记|034】Userspace Bypass: Accelerating Syscall-intensive Applications. | Userspace Bypass：加速系统调用密集型应用程序"
date: 2024-10-10T10:41:24+08:00
tags:
- Kernel Design
- +SOSP '23
---

https://www.usenix.org/conference/osdi23/presentation/zhou-zhe

## 摘要翻译

Context switching between kernel mode and user mode often causes prominent overhead, which slows down applications with frequent system calls (or syscalls), e.g., those with high I/O demand. The overhead is further amplified by security mechanisms like Linux kernel page-table isolation (KPTI). To accelerate such applications, many efforts have been put in removing syscalls from the I/O paths, mainly by combining drivers and applications in the same space or batching syscalls. Nonetheless, such solutions require developers to refactor their applications or even update hardware, which impedes their broad adoption.

In this paper, we propose another approach, userspace bypass (UB), to accelerate syscall-intensive applications, by transparently moving userspace instructions into kernel. Userspace bypass requires no modification to userspace binaries or code and achieves full binary compatibility. Specifically, to avoid overhead caused by frequent syscalls, kernel identifies the short userspace execution path between consecutive system calls, and converts the instructions in the path into code blocks with Software-Based Fault Isolation (SFI) guarantee. According to our evaluation, I/O micro-benchmark can be accelerated by 30.3 – 88.3%, Redis GET Requests Per Second (RPS) can be improved by 4.4 – 10.8% for 1B – 4KiB data sizes, when the application is executed in a virtualized setting with KPTI turned on. The performance boost will be reduced when KPTI is turned off.

在内核模式和用户模式之间切换的上下文切换通常会造成显著的开销，从而减慢频繁进行系统调用（syscall）的应用程序的运行速度，特别是那些具有高 I/O 需求的应用程序。这种开销在安全机制（如 Linux 内核页表隔离 KPTI）影响下进一步加剧。为了加速这些应用，许多研究努力通过将驱动程序和应用程序组合到同一空间或批处理系统调用来移除 I/O 路径中的系统调用。然而，这些解决方案需要开发者重构应用程序或更新硬件，这阻碍了其广泛采用。

本文提出了一种新的方法，称为用户空间绕过（UB），旨在通过透明地将用户空间指令移入内核来加速系统调用密集型应用程序。用户空间绕过不需要修改用户空间的二进制文件或代码，并实现完全的二进制兼容性。具体来说，内核识别连续系统调用之间的短用户空间执行路径，并将路径中的指令转换为具有软件隔离（SFI）保证的代码块，从而避免频繁系统调用所带来的开销。根据我们的评估，在启用 KPTI 的虚拟化环境中，I/O 微基准测试的性能提升可达 30.3% 至 88.3%，Redis 的每秒 GET 请求数（RPS）在 1B 至 4KiB 数据大小下可提高 4.4% 至 10.8%。当 KPTI 关闭时，性能提升将减少。