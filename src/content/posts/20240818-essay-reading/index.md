---
title: "【论文笔记|013】Do OS abstractions make sense on FPGAs? | 操作系统抽象是否能用于FPGA？"
date: 2024-08-18T11:59:36+08:00
tags:
- Operating systems
- Computer systems organization
- FPGA
- +OSDI '20
---

[https://dl.acm.org/doi/10.5555/3488766.3488822](https://dl.acm.org/doi/10.5555/3488766.3488822)


OSDI'20: Proceedings of the 14th USENIX Conference on Operating Systems Design and Implementation
Article No.: 56, Pages 991 - 1010

[https://github.com/fpgasystems/Coyote](https://github.com/fpgasystems/Coyote)


# 论文作者

Dario Korolija, Timothy Roscoe, Gustavo Alonso


# 摘要翻译

Hybrid computing systems, consisting of a CPU server coupled with a Field-Programmable Gate Array (FPGA) for application acceleration, are today a common facility in datacenters and clouds. FPGAs can deliver tremendous improvements in performance and energy efficiency for a range or workloads, but development and deployment of FPGA-based applications remains cumbersome, leading to recent work which replicates subsets of the traditional OS execution environment (virtual memory, processes, etc.) on the FPGA. 

In this paper we ask a different question: to what extent do traditional OS abstractions make sense in the context of an FPGA as part of a hybrid system, particularly when taken as a complete package, as they would be in an OS? To answer this, we built and evaluated Coyote, an open source, portable, configurable “shell” for FPGAs which provides a full suite of OS abstractions, working with the host OS. Coyote supports secure spatial and temporal multiplexing of the FPGA between tenants, virtual memory, communication, and memory management inside a uniform execution environment. The overhead of Coyote is small and the performance benefit is significant, but more importantly it allows us to reflect on whether importing OS abstractions wholesale to FPGAs is the best way forward.

混合计算系统由一个CPU服务器和一个用于应用加速的现场可编程门阵列（FPGA）组成，今天在数据中心和云计算中已成为常见的设施。FPGA可以为各种工作负载带来巨大的性能和能源效率提升，但基于FPGA的应用程序开发和部署仍然很繁琐，因此最近的研究开始在FPGA上复制传统操作系统执行环境的子集（如虚拟内存、进程等）。

在本文中，我们提出了一个不同的问题：在混合系统中将FPGA作为其中一部分时，传统操作系统抽象的概念在多大程度上是有意义的，特别是当这些抽象作为一个完整的包来考虑时。为了解答这个问题，我们构建并评估了Coyote，这是一种用于FPGA的开源、可移植、可配置的“壳”，它提供了一整套操作系统抽象，并与主机操作系统协同工作。Coyote支持FPGA在多个租户之间的安全空间和时间复用，虚拟内存、通信和内存管理，并在一个统一的执行环境中运行。Coyote的开销很小，性能收益显著，但更重要的是，它让我们能够反思将操作系统抽象整体引入FPGA是否是未来的最佳路径。

# 笔记

一句话来说，**Coyote的目标是为了更好地解决CPU+FPGA异构架构下的操作系统对FPGA的抽象与管理**，其整体结构如下：

<p align="center">
  <img src="https://www.oscommunity.cn/2024/08/18/20240818-essay-reading/cyt_ov_light.webp"/>
</p>

其在CPU上运行Coyote Hypervisor，并在其上运行用户程序（Application），并且通过内核模块的的方式对接FPGA部分的**静态层（Static Layer）**。

> In Coyote, the static region always contains logic to partially reconfigure the dynamic region, communicate with the host machine (an xDMA copy engine [57]), and to divide the dynamic region into a set of virtual FPGAs (“vFPGAs”), each of which has an interface mapped into the physical address space of the host CPU (described below).

这部分的主要功能是对另一部分——**动态层（Dynamic Layer）**进行管理，以及通过xDMA和CPU进行交互，动态层和静态层均是FPGA。动态层还包括一系列FPGA实现的**服务（Services）**，如TCP/IP、RDMA等来提供给动态层使用。
动态层最下面是用户逻辑层，用于对用户实现的FPGA逻辑进行部署。

动态层的vFPGA区域首先在空间上将FPGA的资源进行分割，每个区域可以部署一个FPGA逻辑电路，而每个FPGA成为vFPGA的原因是每个空间隔离区域还可以由Coyote调度器进行时间隔离，使得每个分块FPGA并发运行多个只适用这个FPGA的**应用程序**。

<p align="center">
  <img src="https://www.oscommunity.cn/2024/08/18/20240818-essay-reading/coyote1.png" />
</p>

PR (Partial Reconfiguration)：部分重配置是指在不影响FPGA其他部分运行的情况下，动态地重新配置FPGA的一部分逻辑。这意味着可以在FPGA的某个区域进行更新或修改，而无需停止整个FPGA的操作

ICAP (Internal Configuration Access Port)：ICAP是FPGA内部的一个专用接口，它允许从FPGA内部重新配置FPGA的配置内存。ICAP是实现部分重配置的重要组件。

## 线程在FPGA上的抽象

即vFPGA，Coyote认为每个空间隔离的FPGA内实现的电路应当至少能够为多种应用所使用，而不是仅单一应用场景，这样通过分时运行不同的“应用”实现类型vCPU、Thread这样类似传统CPU时间隔离的抽象。

## 进程在FPGA上的抽象

每个vFPGA包括User Logic和Wrapper两个部分，其中User Logic是用户提供的自己的FPGA逻辑，Wrapper则是User Logic和动态层/静态层等其他部分的交互界面。这里Coyote定义了一套User Logic Interface（类似硬件ABI），将CPU部分对FPGA的操作（以及FPGA对CPU部分的DRAM等的操作）进行定义，并通过AXI协议进行通信。

> User software on the CPU interacts with the FPGA by creating a job object, essentially a closure consisting of user logic and other parameters and data. This is passed to the runtime manager for installation on the FPGA. Once functional, the user logic exposes a register interface in physical memory to the CPU, and the runtime manager maps this into the calling process’ address space.
>
> CPU上的用户软件通过创建一个作业（job）对象与FPGA进行交互，作业对象本质上是一个闭包，包含用户逻辑以及其他参数和数据。这个作业对象被传递给运行时管理器，并安装到FPGA上。一旦用户逻辑在FPGA上运行，它会在物理内存中向CPU暴露一个寄存器接口，运行时管理器会将这个接口映射到调用进程的地址空间中。

<p align="center">
  <img src="https://www.oscommunity.cn/2024/08/18/20240818-essay-reading/proc.png" />
</p>

## 调度器在FPGA上的抽象

Coyote的调度是面向vFPGA的，其采用了循环队列仲裁以及每个vFPGA内部的优先队列优先级调度模型：

<p align="center">
  <img src="https://www.oscommunity.cn/2024/08/18/20240818-essay-reading/coyote_sched.png" style="width: 90%;" />
</p>

## 虚拟内存在FPGA上的抽象

内存管理中的虚拟内存如何在CPU+FPGA的模型下实现也是一个问题。在刚才提高的Wrapper中实际上还包括一个Coyote自己提供的FPGA实现的TLB，这个TLB的功能相对传统CPU的TLB更为特殊，其能够将虚拟地址翻译为FPGA内的RAM区域内存或者CPU端的RAM区域，这使得FPGA部分的User Logic以及CPU上运行的用户程序都可以自由访问任何一个内存，无论是CPU端的RAM还是FPGA内部的RAM（由于TLB，某一个vFPGA暴露的内存以及应用程序能看到的CPU端RAM都可以被有效隔离）。

<p align="center">
  <img src="https://www.oscommunity.cn/2024/08/18/20240818-essay-reading/coyote_tlb.png" style="width: 90%;" />
</p>

## 内存管理在FPGA上的抽象

有了上面的虚拟内存抽象基础，Coyote通过实现Linux内核驱动的模式，对CPU端的RAM和各个FPGA自己的RAM进行统一管理和分配。

## IPC/IO等在FPGA上的抽象

Coyote的“进程间通信”（即vFPGA通信）是通过vFPGA之间的通信队列实现的（见上面总架构图中的inter FPGA queue），而（FPGA）IO则是通过Coyote提供的Services部分进行实现的，包括网络栈/RDMA等。

# 相关工作

| 名字         | 开发商                     | 时间 | 介绍                                                                                                     |
| ------------ | -------------------------- | ---- | -------------------------------------------------------------------------------------------------------- |
| **Catapult** | Microsoft                  | 2010 | 一个基于FPGA的云端加速平台，集成在数据中心中，用于提升必应搜索和Azure服务的性能。                        |
| **SDAccel**  | Xilinx                     | 2014 | 一个开发环境，允许开发者使用高级编程语言为FPGA编写应用程序，并自动生成硬件加速器，简化了FPGA的部署过程。 |
| **HARP**     | Intel                      | 2017 | 混合架构研究平台，将CPU和FPGA结合在一起，实现更紧密的耦合和更高效的加速处理。                            |
| **AmorphOS** | VMware Research Group      | 2018 | 一种现代操作系统，用于在数据中心中动态管理FPGA资源，提供灵活的资源分配和任务调度。                       |
| **Optimus**  | University of Michigan     | 2020 | 一个FPGA虚拟化框架，允许多个虚拟机在云环境中高效地共享FPGA资源。                                         |
| **ViTAL**    | University of Pennsylvania | 2020 | 旨在简化FPGA加速器在异构计算环境中的集成和管理的框架。                                                   |


# 词汇

coyote - 美[kaɪˈoʊti] 丛林狼

mediate - 调解