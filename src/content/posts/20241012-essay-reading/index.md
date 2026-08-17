---
title: "【论文笔记|036】Rudra: Finding Memory Safety Bugs in Rust at the Ecosystem Scale|Rudra：从软件生态角度寻找Rust中的内存安全bug"
date: 2024-10-12T17:09:03+08:00
tags:
- Rust
- Memory
- +SOSP '21
---

Authors: Yechan Bae, Youngsuk Kim, Ammar Askar, Jungwon Lim, Taesoo Kim

SOSP '21: Proceedings of the ACM SIGOPS 28th Symposium on Operating Systems Principles

Pages 84 - 99

https://doi.org/10.1145/3477132.3483570

Published: 26 October 2021

## 摘要翻译

Rust is a promising system programming language that guarantees memory safety at compile time. To support diverse requirements for system software such as accessing low-level hardware, Rust allows programmers to perform operations that are not protected by the Rust compiler with the unsafe keyword. However, Rust's safety guarantee relies on the soundness of all unsafe code in the program as well as the standard and external libraries, making it hard to reason about their correctness. In other words, a single bug in any unsafe code breaks the whole program's safety guarantee.

In this paper, we introduce RUDRA, a program that analyzes and reports potential memory safety bugs in unsafe Rust. Since a bug in unsafe code threatens the foundation of Rust's safety guarantee, our primary focus is to scale our analysis to all the packages hosted in the Rust package registry. RUDRA can scan the entire registry (43k packages) in 6.5 hours and identified 264 previously unknown memory safety bugs---leading to 76 CVEs and 112 RustSec advisories being filed, which represent 51.6% of memory safety bugs reported to RustSec since 2016. The new bugs RUDRA found are non-trivial, subtle, and often made by Rust experts: two in the Rust standard library, one in the official futures library, and one in the Rust compiler. RUDRA is open-source, and part of its algorithm is integrated into the official Rust linter.

Rust是一个能够在编译时保证内存安全的很棒的系统编程语言。为了支持系统软件多样的需求，例如访问底层设备，Rust运行程序员使用unsafe关键词来执行不被编译器保护的操作。然而，Rust的安全性由程序、标准库和第三方库中所有的unsafe代码来保证，这使得证明正确性非常困难。换句话说，任何一个unsafe区域的bug都将会破坏整个系统的安全保证。

在本文中，我们介绍了RUDRA，一个分析和报告unsafe Rust中可能的内存bug的程序。由于unsafe code中的bug威胁整个Rust的安全基础，我们的主要目标就是将我们的分析拓展到所有在Rust包管理仓库中的软件包。RUDRA可以在6.5个小时内扫描整个register（4万3000个包），并且找到了264个之前未发现的内存安全bug——76个CVE和112个RustSec advisories（？）记录在案！这基本上是从2016年开始向RustSec报告的内存安全bug的51.6%了。RUDRA发现的新bug复杂、隐秘、并且经常是由Rust高手一手编写的。Rust std中有两个bug、futures lib中一个、编译器中一个。RUDRA是一个开源软件，其中部分的算法已经集成到了官方Rust linter之中。