---
title: "【论文笔记|012】Mac OS versus FreeBSD: A Comparative Evaluation | Mac OS 与 FreeBSD 的比较评估"
date: 2024-08-14T20:32:51+08:00
tags:
- Operating systems
- Message systems
- Task analysis
- Computer architecture
- Scheduling
---

https://ieeexplore.ieee.org/document/8301116

Published in: Computer (Volume: 51, Issue: 2, February 2018)

https://doi.org/10.1109/MC.2018.1451648

# 摘要翻译

FreeBSD (an open source Unix-like OS) and Apple’s Mac OS use similar BSD functionality but take different approaches. FreeBSD implements a traditional compact monolithic Unix kernel, whereas Mac OS builds the BSD Unix functionality on top of the Mach microkernel. The authors provide an in-depth technical investigation of both approaches.

FreeBSD（一个开源的类 Unix 操作系统）和苹果的 Mac OS 使用了类似的 BSD 功能，但采取了不同的实现方式。FreeBSD 实现了传统的紧凑型单体 Unix 内核，而 Mac OS 则将 BSD Unix 功能构建在 Mach 微内核之上。作者对这两种方法进行了深入的技术研究。

# 笔记

> Mac OS uses the **xnu** kernel—xnu stands for “xnu is not Unix.” It consists of the **Mach core**, the **BSD layer**, and the **I/O Kit** (an object-oriented device driver development framework). Specifically, xnu uses a modified Mach microkernel for the lower-level functionality. On top of the Mach primitives, it implements BSD functionality. In essence, it layers BSD on top of the Mach infrastructure. FreeBSD uses a custom modular kernel, which is organized as a traditional Unix monolithic kernel. The FreeBSD kernel creates and manages processes, provides functions to access the filesystem, and supplies communication facilities.

Mac OS 使用的是 xnu 内核——xnu 代表“xnu is not Unix”（xnu 不是 Unix）。它由 Mach 核心、BSD 层和 I/O Kit（一个面向对象的设备驱动程序开发框架）组成。具体来说，xnu 使用了修改过的 Mach 微内核来实现底层功能。在 Mach 原语之上，它实现了 BSD 功能。本质上，它将 BSD 层构建在 Mach 基础设施之上。FreeBSD 使用的是自定义的模块化内核，其组织方式类似于传统的 Unix 单体内核。FreeBSD 内核负责创建和管理进程，提供访问文件系统的功能，并提供通信设施。

xun 和 FreeBSD均为宏内核，而Mach内核则是一个微内核，但是Apple考虑到效率问题，将BSD组件也放到了Mach内核的地址空间内，通过函数调用进行交互。

xnu和FreeBSD的结构：

```
xnu Kernel
  ├── BSD Layer
  |    ├── POSIX APIs
  |    ├── Network Stack
  |    └── File System
  |
  ├── Mach Microkernel
  |    ├── Task Management
  |    ├── Inter-process Communication
  |    └── Memory Management
  |
  └── I/O Kit
       └── Device Driver Framework

FreeBSD Kernel
  ├── Process Management
  |    ├── Scheduling
  |    ├── Process Creation
  |    └── Signals
  |
  ├── File System
  |    ├── VFS (Virtual File System)
  |    ├── UFS/FFS (Unix File System)
  |    └── ZFS (Zettabyte File System)
  |
  ├── Networking Stack
  |    ├── TCP/IP
  |    ├── Routing
  |    └── Firewall
  |
  ├── Memory Management
  |    ├── Paging
  |    ├── Swapping
  |    └── Virtual Memory
  |
  └── Device Drivers
       ├── Disk Drivers
       ├── Network Interface Drivers
       └── Other Hardware Interfaces

```

xnu采用消息进行对象传递：

> Messages are passed between end points, or ports. These are 32-bit integer identifiers, although they are used as opaque objects. Messages are sent from one port to another port. Multiple senders can send messages to the same port, and these messages are enqueued until they are received by the designated receiver for that port.

> The FreeBSD kernel consists of processes that execute in kernel mode and routines that execute periodically within the kernel. Mach’s kernel is organized as a kernel task with multiple kernel threads.

> FreeBSD 内核包括在内核模式下执行的进程和在内核内部定期执行的例程。这里的“内核模式”指的是操作系统的一种权限级别，在这种模式下，代码可以直接访问硬件资源和内存。这意味着 FreeBSD 的内核是通过传统的进程来管理系统任务的，这些进程在需要时运行特定的内核例程。Mach 内核被组织为一个内核任务（kernel task），并且包含多个内核线程（kernel threads）。这里的“内核任务”是一个抽象的概念，代表内核本身，而“内核线程”则是具体执行任务的单元。与 FreeBSD 的单一进程不同，Mach 内核使用多线程来并行处理多个任务。

FreeBSD采用了明确的进程/线程分离的模型，并且利用turnstile队列实现了优先级反转机制，提高实时性。

> FreeBSD implements an elaborate priority-inversion mechanism using **turnstile queues**. It organizes its  sleep and turnstile queues effectively by keeping them in a data structure hashed by an event identifier. The hashing provides efficient search for the threads that need to be awakened for an event. When a high-priority thread blocks a contested resource, its turnstile queue is used to detect the lock holder thread and to raise the priority of that thread to release the lock. This priority-inversion mechanism significantly facilitates the implementation of applications with real-time constraints.

# 词汇

turnstile - 旋转栅门(常设于公共建筑、体育场等入口处)