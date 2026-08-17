---
title: "【论文笔记|027】HIDA: A Hierarchical Dataflow Compiler for High-Level Synthesis | HIDA：一种用于高级综合的分层数据流编译器"
date: 2024-10-03T15:56:50+08:00
tags:
- High Level Synthesis
- FPGA
- Neural Networks
- +ASPLOS '24
---

https://dl.acm.org/doi/10.1145/3617232.3624850

Authors: Hanchen Ye, Hyegang Jun, Deming Chen

ASPLOS '24: Proceedings of the 29th ACM International Conference on Architectural Support for Programming Languages and Operating Systems, Volume 1. Pages 215 - 230

https://doi.org/10.1145/3617232.3624850

https://github.com/UIUC-ChenLab/ScaleHLS-HIDA

## 摘要翻译

Dataflow architectures are growing in popularity due to their potential to mitigate the challenges posed by the memory wall inherent to the Von Neumann architecture. At the same time, high-level synthesis (HLS) has demonstrated its efficacy as a design methodology for generating efficient dataflow architectures within a short development cycle. However, existing HLS tools rely on developers to explore the vast dataflow design space, ultimately leading to suboptimal designs. This phenomenon is especially concerning as the size of the HLS design grows. To tackle these challenges, we introduce HIDA1, a new scalable and hierarchical HLS framework that can systematically convert an algorithmic description into a dataflow implementation on hardware. We first propose a collection of efficient and versatile dataflow representations for modeling the hierarchical dataflow structure. Capitalizing on these representations, we develop an automated optimizer that decomposes the dataflow optimization problem into multiple levels based on the inherent dataflow hierarchy. Using FPGAs as an evaluation platform, working with a set of neural networks modeled in PyTorch, HIDA achieves up to 8.54× higher throughput compared to the state-of-the-art (SOTA) HLS optimization tool. Furthermore, despite being fully automated and able to handle various applications, HIDA achieves 1.29× higher throughput over the SOTA RTL-based neural network accelerators on an FPGA.

数据流架构因其在缓解冯·诺依曼架构固有的内存壁垒所面临的挑战方面的潜力而日益受到关注。同时，高级综合（HLS）作为一种设计方法，已证明其在短开发周期内生成高效数据流架构的有效性。然而，现有的 HLS 工具依赖开发者探索庞大的数据流设计空间，最终导致设计次优。随着 HLS 设计规模的增长，这一现象尤为令人担忧。为了解决这些挑战，我们引入了 HIDA，一种新的可扩展的分层 HLS 框架，能够系统地将算法描述转换为硬件上的数据流实现。我们首先提出了一组高效且多功能的数据流表示，用于建模分层数据流结构。基于这些表示，我们开发了一种自动优化器，将数据流优化问题分解为多个层次，依据固有的数据流层次结构进行处理。以 FPGA 作为评估平台，使用一组在 PyTorch 中建模的神经网络，HIDA 实现了比现有最先进（SOTA）HLS 优化工具高达 8.54 倍的吞吐量。此外，尽管 HIDA 是完全自动化的，并能处理各种应用，但在 FPGA 上，其吞吐量比 SOTA RTL 基神经网络加速器高出 1.29 倍。