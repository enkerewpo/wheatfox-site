---
title: "【论文笔记|027】Limitations and Opportunities of Modern Hardware Isolation Mechanisms | 现代硬件隔离机制的限制和机会"
date: 2024-10-02T18:34:33+08:00
tags:
- Operating Systems
- +ATC '24
---

Xiangdong Chen, Zhaofeng Li, Tirth Jain, Vikram Narayanan, and Anton Burtsev

University of Utah, Maya Labs

https://www.usenix.org/conference/atc24/presentation/chen-xiangdong

## 摘要翻译

A surge in the number, complexity, and automation of targeted security attacks has triggered a wave of interest in hardware support for isolation. **Intel memory protection keys (MPK)**, **ARM pointer authentication (PAC)**, **ARM memory tagging extensions (MTE)**, and **ARM Morello capabilities** are just a few hardware mechanisms aimed at supporting lowoverhead isolation in recent CPUs. These new mechanisms aim to bring practical isolation to a broad range of systems, e.g., browser plugins, device drivers and kernel extensions, user-defined database and network functions, serverless cloud platforms, and many more. However, as these technologies are still nascent, their advantages and limitations are yet unclear. In this work, we do an in-depth look at modern hardware isolation mechanisms with the goal of understanding their suitability for the isolation of subsystems with the tightest performance budgets. Our analysis shows that while a huge step forward, the isolation mechanisms in commodity CPUs are still lacking implementation of several design principles critical for supporting low-overhead enforcement of isolation boundaries, zero-copy exchange of data, and secure revocation of access permissions.

针对性安全攻击的数量、复杂性和自动化的激增引发了对硬件隔离支持的广泛关注。Intel的内存保护键（MPK）、ARM的指针认证（PAC）、ARM的内存标签扩展（MTE）以及ARM Morello能力机制是最近CPU中支持低开销隔离的几种硬件机制。这些新机制旨在为广泛的系统提供实用的隔离，例如浏览器插件、设备驱动程序和内核扩展、用户定义的数据库和网络功能、无服务器云平台等。然而，由于这些技术仍处于初期阶段，它们的优势和局限性尚不清楚。在这项工作中，我们对现代硬件隔离机制进行了深入分析，旨在了解它们在具有严格性能预算的子系统隔离中的适用性。我们的分析表明，尽管这些机制是向前迈出的巨大一步，但商品CPU中的隔离机制仍缺乏若干关键设计原则的实现，这些设计原则对于支持低开销的隔离边界执行、零拷贝数据交换以及访问权限的安全撤销至关重要。