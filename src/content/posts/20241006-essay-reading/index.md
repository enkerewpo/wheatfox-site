---
title: "【论文笔记|030】Dynamic application reconfiguration on heterogeneous hardware | 异构硬件的动态应用重配置"
date: 2024-10-06T14:39:40+08:00
tags:
- Heterogeneous Computing
- Dynamic Reconfiguration
- FPGA
- GPU
- JVM
- +VEE '19
---

https://dl.acm.org/doi/10.1145/3313808.3313819

Authors: Juan Fumero, Michail Papadimitriou, Foivos S. Zakkak, Maria Xekalaki, James Clarkson, Christos Kotselidis

VEE 2019: Proceedings of the 15th ACM SIGPLAN/SIGOPS International Conference on Virtual Execution Environments

Pages 165 - 178

https://doi.org/10.1145/3313808.3313819

Published: 14 April 2019

## 摘要翻译

By utilizing diverse heterogeneous hardware resources, developers can significantly improve the performance of their applications. Currently, in order to determine which parts of an application suit a particular type of hardware accelerator better, an offline analysis that uses a priori knowledge of the target hardware configuration is necessary. To make matters worse, the above process has to be repeated every time the application or the hardware configuration changes.

This paper introduces TornadoVM, a virtual machine capable of reconfiguring applications, at runtime, for hardware acceleration based on the currently available hardware resources. Through TornadoVM, we introduce a new level of compilation in which applications can benefit from heterogeneous hardware. We showcase the capabilities of TornadoVM by executing a complex computer vision application and six benchmarks on a heterogeneous system that includes a CPU, an FPGA, and a GPU. Our evaluation shows that by using dynamic reconfiguration, we achieve an average of 7.7× speedup over the statically-configured accelerated code.

通过利用多样化的异构硬件资源，开发人员可以显著提升其应用程序的性能。目前，为了确定应用程序的哪些部分更适合特定类型的硬件加速器，通常需要使用针对目标硬件配置的先验知识进行离线分析。更糟糕的是，每当应用程序或硬件配置发生变化时，上述过程都需要重复进行。

本文介绍了TornadoVM，这是一种能够在运行时根据当前可用硬件资源重新配置应用程序以实现硬件加速的虚拟机。通过TornadoVM，我们引入了一种新的编译层次，使应用程序能够从异构硬件中受益。我们展示了TornadoVM的能力，通过在包括CPU、FPGA和GPU的异构系统上执行复杂的计算机视觉应用程序和六个基准测试。评估结果表明，通过动态重配置，我们在静态配置加速代码的基础上实现了平均7.7倍的加速效果。