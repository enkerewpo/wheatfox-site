---
title: "【论文笔记|029】HPVM: Heterogeneous Parallel Virtual Machine | HPVM：异构并行虚拟机"
date: 2024-10-05T18:03:25+08:00
tags:
- LLVM
- Heterogeneous Computing
- Virtual Machine
- +PPoPP '18
---

https://dl.acm.org/doi/10.1145/3178487.3178493

Authors: Maria Kotsifakou, Prakalp Srivastava, Matthew D. Sinclair, Rakesh Komuravelli, Vikram Adve, Sarita Adve

PPoPP '18: Proceedings of the 23rd ACM SIGPLAN Symposium on Principles and Practice of Parallel Programming

Pages 68 - 80

https://doi.org/10.1145/3178487.3178493

Published: 10 February 2018

## 摘要翻译

We propose a parallel program representation for heterogeneous systems, designed to enable performance portability across a wide range of popular parallel hardware, including GPUs, vector instruction sets, multicore CPUs and potentially FPGAs. Our representation, which we call HPVM, is a hierarchical dataflow graph with shared memory and vector instructions. HPVM supports three important capabilities for programming heterogeneous systems: a compiler intermediate representation (IR), a virtual instruction set (ISA), and a basis for runtime scheduling; previous systems focus on only one of these capabilities. As a compiler IR, HPVM aims to enable effective code generation and optimization for heterogeneous systems. As a virtual ISA, it can be used to ship executable programs, in order to achieve both functional portability and performance portability across such systems. At runtime, HPVM enables flexible scheduling policies, both through the graph structure and the ability to compile individual nodes in a program to any of the target devices on a system. We have implemented a prototype HPVM system, defining the HPVM IR as an extension of the LLVM compiler IR, compiler optimizations that operate directly on HPVM graphs, and code generators that translate the virtual ISA to NVIDIA GPUs, Intel's AVX vector units, and to multicore X86-64 processors. Experimental results show that HPVM optimizations achieve significant performance improvements, HPVM translators achieve performance competitive with manually developed OpenCL code for both GPUs and vector hardware, and that runtime scheduling policies can make use of both program and runtime information to exploit the flexible compilation capabilities. Overall, we conclude that the HPVM representation is a promising basis for achieving performance portability and for implementing parallelizing compilers for heterogeneous parallel systems.

我们提出了一种用于异构系统的并行程序表示，旨在实现广泛流行的并行硬件（包括GPU、向量指令集、多核CPU以及可能的FPGA）之间的性能可移植性。我们称之为HPVM的表示是一种具有共享内存和向量指令的分层数据流图。HPVM支持异构系统编程的三个重要功能：编译器中间表示（IR）、虚拟指令集（ISA）和运行时调度基础；而以往的系统只专注于其中一个功能。作为编译器IR，HPVM旨在实现异构系统的有效代码生成和优化。作为虚拟ISA，它可以用于分发可执行程序，以实现这些系统的功能和性能可移植性。在运行时，HPVM通过图结构和将程序中的各个节点编译到系统上的任何目标设备的能力，实现灵活的调度策略。我们实现了一个HPVM系统原型，将HPVM IR定义为LLVM编译器IR的扩展，能够直接对HPVM图进行编译器优化，并开发了将虚拟ISA翻译到NVIDIA GPU、英特尔AVX向量单元和多核X86-64处理器的代码生成器。实验结果显示，HPVM优化显著提升了性能，HPVM翻译器在GPU和向量硬件上的性能与手动开发的OpenCL代码相当，运行时调度策略能够利用程序和运行时信息来发挥灵活的编译能力。总体而言，我们认为HPVM表示是实现性能可移植性和实现异构并行系统并行化编译器的有前景的基础。

## 笔记

1. HPVM：层次化数据流图，包括共享内存、向量指令
2. HPVM支持的三个核心能力：
    1. 编译器中间表示（IR）
    2. 虚拟ISA
    3. 运行时调度基础模块
3. HPVM IR是LLVM IR的拓展
4. 实现了一些对HPVM IR的优化pass
5. 实现了一个虚拟ISA（virtual ISA）到NVIDIA GPU、Intel AVX向量单元、多核x86_64处理器的代码生成
6. 实验部分：有明显的性能提升，HPVM生成的代码和手动编写的OpenCL代码性能相当，运行时调度策略能够利用程序和运行时的信息来利用灵活的编译能力？

E. A. Ashcroft and W. W. Wadge. 1977. Lucid, a Nonprocedural Language with Iteration. Commun. ACM (1977).

D.E. Culler, S.C. Goldstein, K.E. Schauser, and T. Voneicken. 1993. TAM - A Compiler Controlled Threaded Abstract Machine. Parallel and Distributed Computing.

Vladimir Gajinov, Srdjan Stipic, Osman S. Unsal, Tim Harris, Eduard Ayguadé, and Adrián Cristal. 2012. Integrating Dataflow Abstractions into the Shared Memory Model. In 2012 IEEE 24th International Symposium on Computer Architecture and High Performance Computing. 243–251.

Vladimir Gajinov, Srdjan Stipic, Osman S. Unsal, Tim Harris, Eduard Ayguadé, and Adrián Cristal. 2012. Supporting Stateful Tasks in a Dataflow Graph. In Proceedings of the 21st International Conference on Parallel Architectures and Compilation Techniques (PACT ’12). ACM, New York, NY, USA, 435–436.

Jin Zhou and Brian Demsky. 2010. Bamboo: A Data-centric, Objectoriented Approach to Many-core Software. In Proceedings of the 31st ACM SIGPLAN Conference on Programming Language Design and Implementation (PLDI ’10). ACM, New York, NY, USA, 388–399.

https://dblp.org/rec/conf/ppopp/KotsifakouSSKAA18.html