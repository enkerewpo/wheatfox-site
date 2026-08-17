---
title: "【论文笔记|031】A Survey of Heterogeneous Computing: Concepts and Systems | 异构计算综述：概念与系统"
date: 2024-10-07T11:18:06+08:00
tags:
- Heterogeneous Computing
---

ILIJA EKMECIC, IGOR TARTALJA, AND VELJKO MILUTINOVIC, SENIOR MEMBER, IEEE

Manuscript received October 24, 1995; revised February 22, 1996.

## 摘要翻译

This survey of heterogeneouscomputing concepts anldsystems is based on the recently proposed by the authors “EM3” (Execution Modes/Machine Models) taxonomy of computer systems in general. The taxonomy is based on two criteria: lhe number of execution modes supported by the system and the number of machine models present in the system. Since these two criteria are orthogonal, four classes exist: Single Execution mode/Single machine Model (SESM),Single Execution mode/Multiple machine Models (SEMM), Multiple Execution modes/Single machine Model (MESM),and Multiple Execution modes/Multiple machine Models (MEMM). 

In Section II, heterogeneous computing concepts are viewed through three phases of the compilation and execu,rion of any heterogeneous application: parallelism detection, parallelism characterization, and resource allocation. Parallelism detection phase discovers fine-grain parallelism inside every task. This phase is not an exclusive feature of heterogeneous computing, so it will not be dealt with in greater detail. The assignment of parallelism characterization phase is to estimate the behavior of each task in the application on every architecture in the heterogeneoussystem. In theparallelism characterization domain, one original taxonomy is given. This taxonomy contuins scheme classes such as vector and matrix, static and dynamic, implicit and explicit, algorithmic and heuristic, and numeric arid symbolic. Resource allocation phase determines the place and the moment for execution of every task, to optimize certain performance measure related to some criteria. In the resource allocation domain, the existing Casavant-Kuhl taxonomy is extended and used. This well known taxonomy is supplemented with scheme classes such as noncooperative competitive, noncooperative noncompetitive, and load sharing.

In Section III, heterogeneous systems Characterized with multiple execution modes (“filly” heterogeneous systems falling in the MESM and the MEMM class) are surveyed. The MESM class systems are described and illustrated with three case studies, two of which support SIMD/MMD and one supports scalar/vector combination of execution modes. The MEMM class systems are described and illustrated with two representative examples of fully heterogeneous networks supporting multiple execution modes. The system softwarefor heterogeneous computing systems is presented according to an original three-dimensional (3-0)taxonomy whose criteria rely on the level of heterogeneity support implementation, the programming approach, and the data access technique applied. In Section HI, several representative heterogeneous applications are described with their computation requirements and the systems used for their execution. Each topic covered in the paper contains several concise examples.

这篇关于异构计算概念和系统的综述基于作者最近提出的“EM3”（执行模式/机器模型）计算机系统分类法。该分类法基于两个标准：系统支持的执行模式数量和系统中存在的机器模型数量。由于这两个标准是正交的，因此存在四类：单执行模式/单机器模型（SESM）、单执行模式/多机器模型（SEMM）、多执行模式/单机器模型（MESM）和多执行模式/多机器模型（MEMM）。

在第二部分中，异构计算概念通过任何异构应用程序的编译和执行的三个阶段来进行观察：并行性检测、并行性特征化和资源分配。并行性检测阶段发现每个任务内部的细粒度并行性。这个阶段不是异构计算的独有特性，因此不会详细讨论。并行性特征化阶段的任务是估计应用程序中每个任务在异构系统中每种架构上的行为。在并行性特征化领域，提供了一个原始的分类法。该分类法包含矢量和矩阵、静态和动态、隐式和显式、算法和启发式、数值和符号等方案类别。资源分配阶段确定每个任务的执行位置和时间，以优化与某些标准相关的性能指标。在资源分配领域，现有的Casavant-Kuhl分类法得到了扩展和使用。这一著名的分类法补充了非合作竞争、非合作非竞争和负载共享等方案类别。

在第三部分中，对具有多执行模式的异构系统（属于MESM和MEMM类的“完全”异构系统）进行了综述。描述了MESM类系统，并通过三个案例研究进行了说明，其中两个支持SIMD/MMD，一个支持标量/矢量组合的执行模式。描述了MEMM类系统，并通过两个支持多执行模式的完全异构网络的代表性例子进行了说明。异构计算系统的软件系统根据一个原始的三维（3D）分类法进行了展示，其标准依赖于异构支持实现的级别、编程方法和数据访问技术。在第三部分，描述了几种代表性的异构应用程序及其计算需求和用于执行它们的系统。论文中每个主题都包含几个简明的例子。