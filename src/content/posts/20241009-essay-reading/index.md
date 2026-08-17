---
title: "【论文笔记|033】A shared compilation stack for distributed-memory parallelism in stencil DSLs | 基于分布式内存并行的网格DSL共享编译栈"
date: 2024-10-09T14:42:58+08:00
tags:
- Distributed Memory
- Compiler
- MLIR
- HPC
- DSL
- +ASPLOS '24
---

Authors: George Bisbas, Anton Lydike, Emilien Bauer, Nick Brown, Mathieu Fehr, Lawrence Mitchell, Gabriel Rodriguez-Canal, Maurice Jamieson, Paul H. J. Kelly, Michel Steuwer, Tobias Grosser

ASPLOS '24: Proceedings of the 29th ACM International Conference on Architectural Support for Programming Languages and Operating Systems, Volume 3

Pages 38 - 56

https://doi.org/10.1145/3620666.3651344

Published: 27 April 2024

## 摘要翻译

Domain Specific Languages (DSLs) increase programmer productivity and provide high performance. Their targeted abstractions allow scientists to express problems at a high level, providing rich details that optimizing compilers can exploit to target current- and next-generation supercomputers. The convenience and performance of DSLs come with significant development and maintenance costs. The siloed design of DSL compilers and the resulting inability to benefit from shared infrastructure cause uncertainties around longevity and the adoption of DSLs at scale. By tailoring the broadly-adopted MLIR compiler framework to HPC, we bring the same synergies that the machine learning community already exploits across their DSLs (e.g. Tensorflow, PyTorch) to the finite-difference stencil HPC community. We introduce new HPC-specific abstractions for message passing targeting distributed stencil computations. We demonstrate the sharing of common components across three distinct HPC stencil-DSL compilers: Devito, PSyclone, and the Open Earth Compiler, showing that our framework generates high-performance executables based upon a shared compiler ecosystem.

领域特定语言（DSLs）提高了程序员的生产力并提供了高性能。它们的针对性抽象允许科学家在高层次上表达问题，同时提供了丰富的细节，优化编译器可以利用这些细节来面向当前和下一代超级计算机进行优化。然而，DSL的便利性和高性能伴随着显著的开发和维护成本。DSL编译器的孤立设计以及无法利用共享基础设施的问题，导致了关于DSL在大规模应用中的持久性和采用的不确定性。通过将广泛采用的MLIR编译器框架定制为高性能计算（HPC）使用，我们将机器学习社区已经在其DSLs（如TensorFlow、PyTorch）中受益的协同效应带入了有限差分网格的HPC领域。我们引入了针对分布式网格计算的消息传递的HPC特定抽象。我们展示了在三个不同的HPC网格DSL编译器（Devito、PSyclone 和 Open Earth Compiler）中共享公共组件，证明了我们的框架基于共享的编译器生态系统生成了高性能的可执行文件。