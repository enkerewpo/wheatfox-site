---
title: "【论文笔记|017】HYPER-CUBE: High-Dimensional Hypervisor Fuzzing | HYPER-CUBE：高维Hypervisor模糊测试"
date: 2024-09-10T20:51:46+08:00
tags:
- Virtualization
- Fuzzing Test
- +NDSS '20
---

Sergej Schumilo, Cornelius Aschermann, and et al.

NDSS 2020

# 摘要翻译

Virtual machine monitors (VMMs, also called hypervisors) represent a very critical part of a modern software stack: compromising them could allow an attacker to take full control of the whole cloud infrastructure of any cloud provider. Hence their security is critical for many applications, especially in the context of Infrastructure-as-a-Service. In this paper, we present the design and implementation of HYPER-CUBE, a novel fuzzer that aims explicitly at testing hypervisors in an efficient, effective, and precise way. Our approach is based on a custom operating system that implements a custom bytecode interpreter. This high-throughput design for long-running, interactive targets allows us to fuzz a large number of both open source and proprietary hypervisors. In contrast to one-dimensional fuzzers such as AFL, HYPER-CUBE can interact with any number of interfaces in any order. Our evaluation results show that we can find more bugs (over 2×) and coverage (as much as 2×) than state-of-the-art hypervisor fuzzers. In most cases, we were even able to do so using multiple orders of magnitude less time than comparable fuzzers. HYPER-CUBE was also able to rediscover a set of well-known hypervisor vulnerabilities, such as VENOM, in less than five minutes. In total, we found 54 novel bugs, and so far obtained 43 CVEs. Our evaluation results demonstrate that next-generation coverage-guided fuzzers should incorporate a higher-throughput design for long-running targets such as hypervisors.

虚拟机监控器（VMM，也称为Hypervisor）是现代软件堆栈中非常关键的一部分：如果它们被攻破，攻击者可能会完全控制任何云服务提供商的整个云基础设施。因此，它们的安全性对于许多应用程序来说至关重要，尤其是在基础设施即服务（IaaS）的背景下。本文介绍了HYPER-CUBE的设计和实现，这是一种新颖的模糊测试工具，旨在高效、有效且精确地测试Hypervisor。我们的方法基于一个实现自定义字节码解释器的自定义操作系统。这种面向长期运行和交互目标的高吞吐量设计使我们能够对大量开源和专有Hypervisor进行模糊测试。与AFL等单维度模糊测试工具相比，HYPER-CUBE可以以任意顺序与任意数量的接口交互。我们的评估结果显示，我们发现了更多漏洞（超过2倍）和覆盖率（高达2倍），比最先进的Hypervisor模糊测试工具要高。在大多数情况下，我们甚至能够在比可比模糊测试工具少几个数量级的时间内完成这些工作。HYPER-CUBE还能够在不到五分钟内重新发现一些众所周知的Hypervisor漏洞，比如VENOM。总共，我们发现了54个新漏洞，并且到目前为止已获得43个CVE编号。我们的评估结果表明，新一代覆盖引导型模糊测试工具应为像Hypervisor这样的长时间运行目标采用更高吞吐量设计。

# 笔记

VDF

IOFUZZ

