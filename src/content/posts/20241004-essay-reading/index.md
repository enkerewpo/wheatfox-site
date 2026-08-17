---
title: "【论文笔记|028】A Study of Heterogeneous Computing Design Method based on Virtualization Technology | hCODE：基于虚拟化技术的异构计算设计方法"
date: 2024-10-04T16:31:30+08:00
tags:
- Heterogeneous Computing
- Virtualization
---

https://dl.acm.org/doi/10.1145/3039902.3039918

Authors: Qian Zhao, Motoki Amagasaki, Masahiro Iida, Morihiro Kuga, Toshinori Sueyoshi

ACM SIGARCH Computer Architecture News, Volume 44, Issue 4

Pages 86 - 91

https://doi.org/10.1145/3039902.3039918

Published: 11 January 2017

## 摘要翻译

One challenge for the heterogeneous computing with the FPGA is how to bridge the development gap between SW and HW designs. The high level synthesis (HLS) technique allows producing hardware with high level languages like C. Design tools based on the HLS like Xilinx SDSoC and SDAccel are developed to speedup SW/HW co-designs. However, the developers still require much circuit design skills to use these tools more efficiently. In this paper, we propose a heterogeneous computing platform based on the virtualization technology, namely hCODE. With the help of the virtualization, the HW and SW design can be totally separated. This brings multiple benefits like accelerating a program without modifying or recompiling it, enable high portability and scalability across different HW and operating system.

在FPGA的异构计算中，一个挑战是如何弥合软件和硬件设计之间的开发差距。高层次综合（HLS）技术允许使用如C这样的高级语言来生成硬件。基于HLS的设计工具，如Xilinx SDSoC和SDAccel，旨在加速软件/硬件协同设计。然而，开发人员仍然需要具备相当的电路设计技能，以更有效地使用这些工具。在本文中，我们提出了一种基于虚拟化技术的异构计算平台，称为hCODE。借助虚拟化，硬件和软件设计可以完全分离。这带来了多个好处，例如在不修改或重新编译程序的情况下加速程序，增强在不同硬件和操作系统之间的可移植性和可扩展性。

## 笔记

1. 目前的不足：
    1. 利用FPGA的开发往往需要同时具有软件和硬件开发的知识，这太难了
    2. 软件开源发展的很好（Linux，etc），然而硬件开源社区体量就很小了
2. 论文尝试做一个软硬件协同的平台，heteogenous Computing Oriented Development Environment（hCODE）
3. 希望解决的问题：
    1. 硬件开发总是在重复造轮子
    2. 软件开发需要硬件知识才能充分利用加速器，软件和硬件没有分离
    3. 创建一个开源硬件IP社区非常困难
4. hCODE在软件和硬件都做了抽象/虚拟化
5. 相关工作：
    1. OpenCores
    2. RIFFA
    3. XILLYBUS（PCIe IP core）
    4. A. Putnam, et al., “A reconfigurable fabric for accelerating large-scale datacenter services, ACM/IEEE 41st International Symposium on Computer Architecture (ISCA), pp.13-24, June 2014.
    5. 虚拟化方面：OpenCL，起初适用于GPGPU的编程接口规范
    6. OpenCores作为硬件开源社区，仅仅是一个存储库，没有版本管理等功能
6. hCODE=hFPGA+hVM+hDevKit