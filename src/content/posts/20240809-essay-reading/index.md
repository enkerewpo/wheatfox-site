---
title: "【论文笔记|011】Lightweight Kernel Isolation with Virtualization and VM Functions | 使用虚拟化和虚拟机功能实现轻量级内核隔离"
date: 2024-08-09T10:52:33+08:00
tags:
- Virtualization
- Security and Privacy
- Software Engineering
- +VEE '20
---

Vikram Narayanan, Yongzhe Huang, Gang Tan, Trent Jaeger, Anton Burtsev

VEE '20: Proceedings of the 16th ACM SIGPLAN/SIGOPS International Conference on Virtual Execution Environments.Pages 157 - 171.

[https://doi.org/10.1145/3381052.3381328](https://doi.org/10.1145/3381052.3381328)

# 摘要翻译

Commodity operating systems execute core kernel subsystems in a single address space along with hundreds of dynamically loaded extensions and device drivers. Lack of isolation within the kernel implies that a vulnerability in any of the kernel subsystems or device drivers opens a way to mount a successful attack on the entire kernel. 

Historically, isolation within the kernel remained prohibitive due to the high cost of hardware isolation primitives. Recent CPUs, however, bring a new set of mechanisms. Extended page-table (EPT) switching with VM functions and memory protection keys (MPKs) provide memory isolation and invocations across boundaries of protection domains with overheads comparable to system calls. Unfortunately, neither MPKs nor EPT switching provide architectural support for isolation of privileged ring 0 kernel code, i.e., control of privileged instructions and well-defined entry points to securely restore state of the system on transition between isolated domains.

Our work develops a collection of techniques for lightweight isolation of privileged kernel code. To control execution of privileged instructions, we rely on a minimal hypervisor that transparently deprivileges the system into a non-root VT-x guest. We develop a new isolation boundary that leverages extended page table (EPT) switching with the VMFUNC instruction. We define a set of invariants that allows us to isolate kernel components in the face of an intricate execution model of the kernel, e.g., provide isolation of preemptable, concurrent interrupt handlers. To minimize overheads of virtualization, we develop support for exitless interrupt delivery across isolated domains. We evaluate our approach by developing isolated versions of several device drivers in the Linux kernel.

传统操作系统在一个地址空间内执行核心内核子系统，以及数百个动态加载的扩展和设备驱动程序。内核内部缺乏隔离意味着内核子系统或设备驱动程序中的任何漏洞都可能导致对整个内核的成功攻击。

历史上，由于硬件隔离原语的高成本，内核内部的隔离一直是不可行的。然而，最近的CPU提供了一组新的机制。扩展页表（EPT）切换与虚拟机功能（VMFUNC）和内存保护键（MPK）在提供跨保护域边界的内存隔离和调用方面，开销与系统调用相当。不幸的是，MPK和EPT切换都没有提供用于隔离特权环0内核代码的架构支持，即控制特权指令和安全恢复系统状态的明确定义的入口点，以在隔离域之间进行转换。

我们的工作开发了一组用于轻量级隔离特权内核代码的技术。为了控制特权指令的执行，我们依赖于一个最小化的虚拟机管理程序，该程序透明地将系统降级为非根VT-x客体。我们开发了一种利用带有VMFUNC指令的扩展页表（EPT）切换的新隔离边界。我们定义了一组不变量，使我们能够在复杂的内核执行模型中隔离内核组件，例如，为可抢占的并发中断处理程序提供隔离。为了最大限度地减少虚拟化的开销，我们开发了跨隔离域的无退出中断传递支持。我们通过开发Linux内核中多个设备驱动程序的隔离版本来评估我们的方法。

# 笔记

Lightweight Virtualized Domains —— LVDs

Lightweight Execution Domains —— LXDs

[https://www.usenix.org/conference/atc19/presentation/narayanan](https://www.usenix.org/conference/atc19/presentation/narayanan)

LVD的三个设计目标：

1. **数据结构安全性**：隔离的驱动程序只能读取和写入为其功能所需的、明确定义的对象及其字段子集，从而有效地实施最小特权原则。
2. **数据结构完整性**：隔离的驱动程序不能更改内核使用的指针或这些指针引用的对象类型，以确保数据结构的完整性。
3. **函数调用完整性**：隔离代码只能调用一组明确定义的内核函数，并传递其“拥有”的对象的合法指针作为参数。此外，不能通过驱动程序接口中注册的不安全函数指针来欺骗内核进行调用。

> LVDs rely on the LXDs decomposition framework [72] that includes an **interface definition language (IDL)** for specifying the interface between kernel modules and generating code for synchronizing the hierarchies of data structures across isolated subsystems.

> Projections, therefore, define the minimal set of objects and their fields accessible to another domain.

# 词汇

reentrant：可重入的