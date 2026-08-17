---
title: "【论文笔记|018】Non-Exclusive Memory Tiering via Transactional Page Migration : 通过事务性页面迁移实现非排他性内存分层"
date: 2024-09-13T17:59:02+08:00
tags:
- Memory Tiering
- +OSDI '24
---

# 摘要翻译

With the advent of byte-addressable memory devices, such as CXL memory, persistent memory, and storage-class memory, tiered memory systems have become a reality. Page migration is the de facto method within operating systems for managing tiered memory. It aims to bring hot data whenever possible into fast memory to optimize the performance of data accesses while using slow memory to accommodate data spilled from fast memory. While the existing research has demonstrated the effectiveness of various optimizations on page migration, it falls short of addressing a fundamental question: Is exclusive memory tiering, in which a page is either present in fast memory or slow memory, but not both simultaneously, the optimal strategy for tiered memory management?

We demonstrate that page migration-based exclusive memory tiering suffers significant performance degradation when fast memory is under pressure. In this paper, we propose nonexclusive memory tiering, a page management strategy that retains a copy of pages recently promoted from slow memory to fast memory to mitigate memory thrashing. To enable non-exclusive memory tiering, we develop NOMAD, a new page management mechanism for Linux that features transactional page migration and page shadowing. NOMAD helps remove page migration off the critical path of program execution and makes migration completely asynchronous. Evaluations with carefully crafted micro-benchmarks and real-world applications show that NOMAD is able to achieve up to 6x performance improvement over the state-of-the-art transparent page placement (TPP) approach in Linux when under memory pressure. We also compare NOMAD with a recently proposed hardware-assisted, access sampling-based page migration approach and demonstrate NOMAD’s strengths and potential weaknesses in various scenarios.

随着字节可寻址内存设备的出现，如CXL内存、持久性内存和存储级内存，分层内存系统已成为现实。在操作系统中，页面迁移是管理分层内存的事实标准方法。其目的是在尽可能将热点数据带入快速内存以优化数据访问性能，同时使用慢速内存在快速内存溢出时容纳数据。尽管现有研究已证明各种优化方法在页面迁移上的有效性，但它未能解决一个根本性的问题：专属性的内存分层，即页面要么存在于快速内存中，要么存在于慢速内存中，而不是同时存在于两者，是管理分层内存的最优策略吗？

我们证明，当快速内存在压力下时，基于页面迁移的专属性记忆分层会导致显著的性能下降。在本文中，我们提出了非排他性记忆分层，一种保留最近从慢速内存提升到快速内存页副本以缓解记忆颠簸的页面管理策略。为实现非排他性记忆分层，我们开发了NOMAD，一种新的Linux页面管理机制，它具有事务性页面迁移和页面影子功能。NOMAD帮助将页迁移从程序执行路径中的关键路径上移除，使迁移完全异步化。通过精心设计的微基准测试和实际应用评估表明，在面临记忆压力时，NOMAD能够比当前最先进Linux透明页放置（TPP）方法实现高达6倍的性能提升。我们还比较了NOMAD与一种最近提出的硬件辅助、基于访问采样的方法，并展示了NOMAD在各种场景中的优势和潜在弱点。