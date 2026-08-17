---
title: "【论文笔记|024】An Empirical Study of Rust-for-Linux: The Success, Dissatisfaction, and Compromise | Rust-for-Linux 的实证研究：成功、不满与妥协"
date: 2024-09-29T09:47:01+08:00
tags:
- Rust
- Linux
- Rust-for-Linux
- +ATC '24
---

https://www.usenix.org/conference/atc24/presentation/li-hongyu

## 摘要翻译

Developed for over 30 years, Linux has already become the computing foundation for today’s digital world; from gigantic, complex mainframes (e.g., supercomputers) to cheap, wimpy embedded devices (e.g., IoTs), countless applications are built on top of it. Yet, such an infrastructure has been plagued by numerous memory and concurrency bugs since the day it was born, due to many rogue memory operations are permitted by C language. A recent project Rust-for-Linux (RFL) has the potential to address Linux’s safety concerns once and for all – by embracing Rust’s static ownership and type checkers into the kernel code, the kernel may finally be free from memory and concurrency bugs without hurting its performance. While it has been gradually matured and even merged into Linux mainline, however, RFL is rarely studied and still remains unclear whether it has indeed reconciled the safety and performance dilemma for the kernel.

To this end, we conduct the first empirical study on RFL to understand its status quo and benefits, especially on how Rust fuses with Linux and whether the fusion assures driver safety without overhead. We collect and analyze 6 key RFL drivers, which involve hundreds of issues and PRs, thousands of Github commits and mail exchanges of the Linux mailing list, as well as over 12K discussions on Zulip. We have found while Rust mitigates kernel vulnerabilities, it is beyond Rust’s capability to fully eliminate them; what is more, if not handled properly, its safety assurance even costs the developers dearly in terms of both runtime overhead and development efforts.

经过 30 多年的发展，Linux 已经成为当今数字世界的计算基础；从巨大的、复杂的主机（例如超级计算机）到廉价的、性能有限的嵌入式设备（例如物联网设备），无数应用都建立在它之上。然而，由于 C 语言允许许多不安全的内存操作，这样一个基础架构自诞生之日起就一直被大量内存和并发错误所困扰。最近的 Rust-for-Linux（RFL）项目有潜力彻底解决 Linux 的安全问题——通过将 Rust 的静态所有权和类型检查器引入内核代码，内核可能最终摆脱内存和并发错误而不影响性能。尽管该项目逐渐趋于成熟，甚至被合并到 Linux 主线中，但 RFL 的研究却非常稀少，其是否真的解决了内核的安全与性能困境仍然不明朗。

为此，我们进行了首个针对 RFL 的实证研究，旨在了解其现状及其带来的益处，特别是 Rust 如何与 Linux 融合，以及这种融合是否在不带来额外负担的情况下确保了驱动程序的安全性。我们收集并分析了 6 个关键的 RFL 驱动程序，这些驱动程序涉及数百个问题和拉取请求、数千个 GitHub 提交记录和 Linux 邮件列表中的交流，以及 Zulip 上超过 12,000 条讨论。我们发现，尽管 Rust 缓解了内核的漏洞，但它无法完全消除这些问题；更重要的是，如果处理不当，它的安全保障甚至会让开发者在运行时开销和开发工作量方面付出沉重代价。

## 笔记

eBPF, io_uring

1. RFL的实现方式：
    1. 将linux API包装，通过rust-bindgen
    2. RFL将这些API进行unsafe包装（Rust Kernel API），提供safe函数
    3. Rust驱动代码在safe中使用这些Rust Kernel API，不出现unsafe

2. 几个insight：
    1. drivers, netdev, file systems属于RFL中的long tail
    
    > “长尾”（Long tail）是指那些需求量较小但数量庞大的产品或事物的集合，虽然单个项目的需求量较低，但它们的总和可能占据相当大的比例。在商业和经济学中，这个概念通常用于描述在线市场或内容分发中，少数几款畅销产品占主导地位，而大量非畅销或冷门产品则组成了市场的长尾部分。
    
    linux这部分代码很多，但是RFL中基本没有

    2. RFL基础设施已经成熟了，下一步是做safe抽象和驱动
    3. RFL受限于code review而不是code devlopment
    4. linux kernel对内存的细粒度控制和rust哲学相悖，使得RFL有额外开销：模拟bitfields和unions、不完整的attribute支持
    5. RFL用辅助类型接管内核数据的管理，但是操作仍然留给了kernel来做

    > With Rust, RFL separates the management from operation of a kernel object. An example is kernel-locking primitives. RFL re-writes the backend for mutex and spinlocks using the helper types. For management, the new backend leverages Deref coercion to safely de-reference the data protected by the lock and use ScopeGuard low-level type for runtime memory reclamation. For operation, RFL still invokes kernel locking/unlocking methods.

    > 在 Rust 的帮助下，RFL 将内核对象的管理与操作分离。一个例子是内核锁定原语。RFL 使用辅助类型重新编写了互斥锁和自旋锁的后端。在管理方面，新的后端利用了 Deref 强制转换来安全地解引用由锁保护的数据，并使用 ScopeGuard 低级类型进行运行时内存回收。在操作方面，RFL 仍然调用内核的锁定/解锁方法。

3. RFL有用吗？
    1. RFL确实让linux更“安全”了。有些bug并不是消失了，而是更难发现了。

    > Such bugs may take a long to fix and can only be detected by experts who are familiar with both Rust and kernel. For example, the C binder driver has a use-after-free [33] bug. When being re-implemented in Rust, it will not cause the same symptom as in C. Instead, it incurs a mapping bug putting the memory into the wrong place which passes all the checks by the Rust compiler.

    > 此类错误可能需要很长时间才能修复，并且只能由熟悉 Rust 和内核的专家检测到。例如，C 语言中的 binder 驱动程序存在一个“使用已释放内存”（use-after-free）错误。当该驱动程序用 Rust 重新实现时，不会表现出与 C 语言中相同的症状。相反，它会引发一个映射错误，将内存放置在错误的位置，并通过了 Rust 编译器的所有检查。

    2. RFL的开销如何？binary size更大了，performance变差了（20%），但是有时会更好。
    3. RFL对linux开发有帮助吗？
        1. 代码质量和可读性提高了
        2. linux社区有更多的年轻力量
        3. 但是年轻力量还暂时不能成为核心开发和维护者
