---
title: "【论文笔记|021】ACCL+: an FPGA-Based Collective Engine for Distributed Applications | ACCL+：基于FPGA的分布式应用集体引擎"
date: 2024-09-26T17:45:19+08:00
tags:
- Distributed System
- FPGA
- +OSDI '24
---

https://www.usenix.org/conference/osdi24/presentation/he

## 摘要翻译

FPGAs are increasingly prevalent in cloud deployments, serving as Smart-NICs or network-attached accelerators. To facilitate the development of distributed applications with FPGAs, in this paper we propose ACCL+, an open-source, FPGA-based collective communication library. Portable across different platforms and supporting UDP, TCP, as well as RDMA, ACCL+ empowers FPGA applications to initiate direct FPGA to FPGA collective communication. Additionally, it can serve as a collective offload engine for CPU applications, freeing the CPU from networking tasks. It is user-extensible, allowing new collectives to be implemented and deployed without having to re-synthesize the entire design. We evaluated ACCL+ on an FPGA cluster with 100 Gb/s networking, comparing its performance against software MPI over RDMA. The results demonstrate ACCL+’s significant advantages for FPGA-based distributed applications and its competitive performance for CPU applications. We showcase ACCL+’s dual role with two use cases: as a collective offload engine to distribute CPU-based vector-matrix multiplication, and as a component in designing fully FPGA-based distributed deep learning recommendation inference.

FPGA在云部署中越来越流行，其可以作为智能网卡或联网加速器来提供服务，为了促进分布式应用程序在FPGA下的发展（没有提到论文要解决什么问题？），在本文中我们提出ACCL+,一个开源的基于FPGA的集体通讯库。ACCL+提供不同平台的可移植性，并支持UPD、TCP、RMDA，为FPGA应用提供直接的跨FPGA集体通信。另外，其能作为CPU程序的集体卸载引擎，将CPU从网络任务中解放出来。ACCL+是用户可拓展的，其允许新集体进行实现和部署，而不需要重新综合设计/我们在支持100Gb/s网络的FPGA中进行了测试，和利用RDMA的MPI软件进行对比。结果显示ACCL+为分布式应用提供了明显优势、为CPU应用提供了有竞争力的性能结果。我们展示了ACCL+的两个角色和使用场景：一是作为集体卸载引擎、来分担CPU的向量矩阵乘法，二是作为设计基于FPGA的分布式深度学习推荐算法推理的一个部分。

## 笔记

1. collecitve communication 集体通讯
2. 目前的工作：
   1. 提高FPGA的可编程性，包括虚拟化FPGA资源
   2. 但是不支持网络资源，这使得分布式FPGA应用只能通过CPU进行通信
   3. 直到最近才有相关工作支持网络
   4. 然而，这些工作缺乏集体通信，使得其不适用更大的分布式使用场景
3. 挑战：
   1. 多种传输协议支持
   2. 提供灵活性支持，部分集体运行不同的算法
   3. 可移植性，包括应用+平台
4. FPGA和CPU和xxx...共享内存/网络栈/PCIe？
5. > In summary, the key question to address is how to effectively design a portable, flexible, high-level collective abstraction on FPGAs that can support various memory models (e.g., partitioned and shared virtual memory model), communication models (e.g., message passing and streaming), and transport protocols (e.g., TCP and RDMA), while accommodating a broad spectrum of applications.
6. CCL - Collective Communication Library