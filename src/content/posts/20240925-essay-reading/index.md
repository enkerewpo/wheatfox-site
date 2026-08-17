---
title: "【论文笔记|020】Virtualizing FPGAs in the Cloud ： 在云计算场景中虚拟化FPGA"
date: 2024-09-25T21:54:30+08:00
tags:
- FPGA
- Cloud Computing
- Virtualization
- +ASPLOS '20
---

ASPLOS’20, March 16–20, 2020, Lausanne, Switzerland

https://dl.acm.org/doi/10.1145/3373376.3378491

## 摘要翻译

Field-Programmable Gate Arrays (FPGAs) have been integrated into the cloud infrastructure to enhance its computing performance by supporting on-demand acceleration. However, system support for FPGAs in the context of the cloud environment is still in its infancy with two major limitations, i.e., the inefficient runtime management due to the tight coupling between compilation and resource allocation, and the high programming complexity when exploiting scale-out acceleration. The root cause is that FPGA resources are not virtualized. In this paper, we propose a full-stack solution, namely ViTAL, to address the aforementioned limitations by virtualizing FPGA resources. Specifically, ViTAL provides a homogeneous abstraction to decouple the compilation and resource allocation. Applications are offline compiled onto the abstraction, while the resource allocation is dynamically determined at runtime. Enabled by a latency-insensitive communication interface, applications can be mapped flexibly onto either one FPGA or multiple FPGAs to maximize the resource utilization and the aggregated system throughput. Meanwhile, ViTAL creates an illusion of a single and large FPGA to users, thereby reducing the programming complexity and supporting scaleout acceleration. Moreover, ViTAL also provides virtualization support for peripheral components (e.g., on-board DRAM and Ethernet), as well as protection and isolation support to ensure a secure execution in the multi-user cloud environment. 

We evaluate ViTAL on a real system—an FPGA cluster composed of the latest Xilinx UltraScale+ FPGAs (XCVU37P). The results show that, compared with the existing management method, ViTAL enables fine-grained resource sharing and reduces the response time by 82% on average (improving Quality-of-Service) with a marginal virtualization overhead. Moreover, ViTAL also reduces the response time by 25% compared to AmorphOS (operating in high-throughput mode), a recently proposed FPGA virtualization method.

在云基础设施中集成FPGA（现场可编程门阵列）的目标是通过特定需求的加速来实现计算性能的提升，然而，云场景下的系统级FPGA支持仍处于相当原始的阶段，并且存在两个主要限制：其一是缺乏对运行时的管理，原因是FPGA的编译和资源分配高度紧耦合，其二是利用横向加速（？scale-out acceleration，横向拓展往往指的是硬件数目增加，如将一个FPGA拓展到一群FPGA？）时的高编程复杂性。究其原因是因为FPGA没有被虚拟化抽象。在本文中我们提出了一个全栈的虚拟化解决方案ViTAL，来解决前面提到的限制。特别的，ViTAL提供了一种同构抽象来解耦编译与资源分配，用户程序离线编译为抽象层，而抽象层的资源分配实在运行时动态分配的。用户程序能够灵活的映射到一个或多个FPGA，通过一个**延迟不敏感的通讯接口**实现，来最大化资源利用率和聚合系统的吞吐。与此同时，ViTAL将一个“单个巨大FPGA模型”抽象给用户，使得编程复杂度降低，并且能够支持横向拓展加速。ViTAL还提供了外设相关的虚拟化支持（DRAM和以太网），以及保护和隔离支持来保证多租户云计算场景下的安全执行。

我们在一个Xilinx UltraScale+ FPGA集群中验证了ViTAL，结果显示相比于已有的管理方式，ViTAL不仅实现了精细的资源共享，而且减少了82%的平均响应时间（提升QoS），附带一个边界虚拟化开销。ViTAL相比近日提出的AmorphOS（高吞吐模式）降低了25%的响应时间。

## 笔记

1. 传统的解决方案无法实现“复用”，FPGA应用集中编译后堆到单个资源上，并且不容易灵活地进行运行时（runtime）重构，作者认为这些解决方案效率不高的主要原因是没有进行虚拟化设计——vFPGA？
2. 抽象单位——virtual blocks，ViTAL维护一个vb数组
3. 物理FPGA分解为：Service Region、Communication Region、User Region
4. User Region里有多个讲FPGA资源按块分解（Row分解）的physical block，每个virtual block应当mapping到一个physical block
5. 每个物理块的时钟skew等实现时需要考虑
6. 编译层：通过在FPGA编译流程加入自己的工具和流程实现自定义的资源分配
   1. > To implement the comprehensive flow while keeping the development cost under control, we reuse the proprietary FPGA tool (**Vivado** in our implementation) and develop a set of new tools either from scratch or by leveraging the open-source **RapidWright** tool from Xilinx
7. Latency-Insensitive Interface Generation
8. ViTAL的placement算法比较有意思，通过迭代和cost计算，最终收敛（模拟退火）到合适的$(x_i,y_i)$位置
9. DNNWeaver生成DNN测试逻辑

> Operation system support for FPGA is an active area of research, and representative works include BORPH [56], ReconOS [46], hthreads [3] and FUSE [31]. These works abstract applications running on FPGAs as hardware threads or processes. The interface provided by these hardware threads/ processes is same as that of the threads/processes running on CPU. Therefore, operation system can manage and communicate with these hardware threads/processes as if they were running on the CPU. Compared with ViTAL, one common limitation of these works is that they do not address the coupling issue between the compilation and resource allocation. The OS support provided by LEAP [24] uses a latencyinsensitive communication interface to enable multiple-FPGA acceleration. This is somewhat similar to the communication interface used in ViTAL. However, the major difference between LEAP and ViTAL is that LEAP requires users to manually partition applications into modules and uses special pragmas to create this latency-insensitive interface, while these are automatically done by the compilation tool in ViTAL. Moreover, LEAP still needs to perform the resource allocation at the offline compile time, while ViTAL performs the resource allocation at runtime to dynamically respond to the actual load and resource availability in the elastic clouds.
>
> FPGA操作系统支持是一个活跃的研究领域，代表性的工作包括BORPH、ReconOS、hthreads和FUSE。这些工作将运行在FPGA上的应用抽象为硬件线程或进程。这些硬件线程/进程提供的接口与在CPU上运行的线程/进程相同。因此，操作系统可以像管理CPU上的线程/进程一样管理和与这些硬件线程/进程进行通信。与ViTAL相比，这些工作的一个共同局限性是它们没有解决编译与资源分配之间的耦合问题。LEAP提供的操作系统支持使用无延迟通信接口来实现多FPGA加速，这与ViTAL中使用的通信接口有些相似。然而，LEAP与ViTAL的主要区别在于，LEAP要求用户手动将应用程序划分为模块，并使用特殊的指令来创建这种无延迟接口，而在ViTAL中，这些工作都是由编译工具自动完成的。此外，LEAP仍需在离线编译时执行资源分配，而ViTAL则在运行时执行资源分配，以动态响应弹性云中的实际负载和资源可用性。

操作系统研究方向，DSA，新硬件，软硬协同，软件定义……