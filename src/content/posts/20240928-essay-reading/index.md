---
title: "【论文笔记|023】DRust: Language-Guided Distributed Shared Memory with Fine Granularity, Full Transparency, and Ultra Efficiency | DRust：细粒度、透明、高效的编程语言引导的分布式共享内存"
date: 2024-09-28T17:00:26+08:00
tags:
- Rust
- Distributed Systems
- Distributed Shared Memory
- +OSDI '24
---

https://www.usenix.org/conference/osdi24/presentation/ma-haoran

## 摘要翻译

Despite being a powerful concept, distributed shared memory (DSM) has not been made practical due to the extensive synchronization needed between servers to implement memory coherence. This paper shows a practical DSM implementation based on the insight that the ownership model embedded in programming languages such as Rust automatically constrains the order of read and write, providing opportunities for significantly simplifying the coherence implementation if the ownership semantics can be exposed to and leveraged by the runtime. This paper discusses the design and implementation of DRust, a Rust-based DSM system that outperforms the two state-of-the-art DSM systems GAM and Grappa by up to 2.64× and 29.16× in throughput, and scales much better with the number of servers.

分布式共享内存（DSM）虽然是一个非常强力的概念，但是其并没有被进行实用化，原因是在服务器直接实现内存一致性需要广泛的同步。本文提出了一种实用的DSM实现，基于编程语言的所有权模型（如Rust）来限制读写顺序，如果代码的所有权机制能够暴露并提供给运行时使用，这将为极大简化一致性实现提供机会。本文讨论了DRust的设计与实现，DRust是一个基于Rust语言的DSM系统，并且能够比目前SOTA的两个DSM系统——GAM和Grappa——表现更好，在吞吐上提升2.64倍和29.16倍，并且随着服务器数量增加能够灵活拓展。

## 笔记

Limitations:

1. DRust的分布式一致性只对safe进行保证，unsafe部分仍然是依靠开发者负责。
2. DRust的效果提升主要依赖应用程序代码对SWMR（Single Write Multiple Read）机制的暴露，对于Mutex这种共享状态的数据，DRust会退化为传统DSM系统。
3. 暂时不支持ASLR（address space layout randomization）
