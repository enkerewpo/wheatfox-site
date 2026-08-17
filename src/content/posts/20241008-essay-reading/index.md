---
title: "【论文笔记|032】HeteroRefactor: Refactoring for Heterogeneous Computing with FPGA | HeteroRefactor：使用FPGA对异构计算进行重构"
date: 2024-10-08T17:32:39+08:00
tags:
- FPGA
- Heterogenous Computing
- +ICSE '20
---

https://dl.acm.org/doi/10.1145/3377811.3380340

Authors: Jason Lau, Aishwarya Sivaraman, Qian Zhang, Muhammad Ali Gulzar, Jason Cong, Miryung Kim

ICSE '20: Proceedings of the ACM/IEEE 42nd International Conference on Software Engineering

Pages 493 - 505

https://doi.org/10.1145/3377811.3380340

Published: 01 October 2020

## 摘要翻译

Heterogeneous computing with field-programmable gate-arrays (FPGAs) has demonstrated orders of magnitude improvement in computing efficiency for many applications. However, the use of such platforms so far is limited to a small subset of programmers with specialized hardware knowledge. High-level synthesis (HLS) tools made significant progress in raising the level of programming abstraction from hardware programming languages to C/C++, but they usually cannot compile and generate accelerators for kernel programs with pointers, memory management, and recursion, and require manual refactoring to make them HLS-compatible. Besides, experts also need to provide heavily handcrafted optimizations to improve resource efficiency, which affects the maximum operating frequency, parallelization, and power efficiency. 

We propose a new dynamic invariant analysis and automated refactoring technique, called HeteroRefactor. First, HeteroRefactor monitors FPGA-specific dynamic invariants—the required bitwidth of integer and floating-point variables, and the size of recursive data structures and stacks. Second, using this knowledge of dynamic invariants, it refactors the kernel to make traditionally HLS-incompatible programs synthesizable and to optimize the accelerator’s resource usage and frequency further. Third, to guarantee correctness, it selectively offloads the computation from CPU to FPGA, only if an input falls within the dynamic invariant. On average, for a recursive program of size 175 LOC, an expert FPGA programmer would need to write 185 more LOC to implement an HLS compatible version, while HeteroRefactor automates such transformation. Our results on Xilinx FPGA show that HeteroRefactor minimizes BRAM by 83% and increases frequency by 42% for recursive programs; reduces BRAM by 41% through integer bitwidth reduction; and reduces DSP by 50% through floating-point precision tuning.

使用FPGA进行异构计算已经在需要应用中展现出计算效率的巨大提升，但是，使用这些平台的人目前仅限于程序员中具有专业的硬件知识的一小撮人。HLS工具的出现让编程抽象从硬件编程语言升级为C/C++，但是，HLS往往无法编译生成带指针/内存管理/递归的kernel programs（？）的加速器，其需要手动重构来实现HLS支持。除此之外，还需要专家提供大量手动调优的优化，来提高资源利用效率，其影响着最大操作频率、并行化程度和功率效率。

我们提出了一种新的动态不变分析和自动化的重构技巧——HeteroRefactor。首先，其监控FPGA上的动态不变量（invariants？）——int/float变量需要的位宽，以及递归数据结构（recursive data structure？）和栈的大小。其次，通过动态不变量的知识，其重构kernel来使其能够HLS综合，并且进一步优化加速器的资源使用和频率。为了保证正确性，其选择性地从CPU卸载负载到FPGA，仅当一个输入落入动态不变量（？）。平均下来，对于一个175行的递归程序，一个顶级FPGA程序员可能需要写185+行的代码来实现HLS的版本，但是HeteroRefactor自动化了这一步骤。我们在Xilinx FPGA上的实验结果表示，HeteroRefactor减少了递归程序的83%的BRAM使用，并提高了42%的频率，通过int位宽减少技巧降低了41%的BRAM使用，通过float精度调优降低了50%的DSP使用。

## 笔记

dynamic invariant analysis