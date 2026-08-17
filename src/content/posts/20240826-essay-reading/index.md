---
title: "【论文笔记|015】Understanding “software-defined” from an OS perspective: technical challenges and research issues | 从操作系统角度看‘软件定义’：技术挑战与研究问题"
date: 2024-08-26T19:18:27+08:00
tags:
- Operating system
- software-defined everything
- ubiquitous operating systems
---

[https://link.springer.com/article/10.1007/s11432-017-9240-4](https://link.springer.com/article/10.1007/s11432-017-9240-4)

Mei, H. Understanding “software-defined” from an OS perspective: technical challenges and research issues. Sci. China Inf. Sci. 60, 126101 (2017). [https://doi.org/10.1007/s11432-017-9240-4](https://doi.org/10.1007/s11432-017-9240-4)

Hong MEI;
Beijing Institute of Technology, Beijing 100081, China;
Key Laboratory on High-Confidence Software Technologies (MOE), Peking University, Beijing 100871, China;

# 笔记

> What is “software-defined”? Software-defined has become one of the hottest buzzwords in the information technology (IT) community. It is used to describe a family of technologies, including software-defined networking (SDN), softwaredefined storage (SDS), and software-defined data centers (SDDC). These are part of a broader trend that is referred to as software-defined everything (SDX). The movement toward software-defined infrastructure is focused on decoupling hardware layers that execute data transactions and computations from the software layers that manage them.
>
> “软件定义”是什么意思？“软件定义”已经成为信息技术（IT）社区中最热门的流行词之一。它被用来描述一系列技术，包括软件定义网络（SDN）、软件定义存储（SDS）和软件定义数据中心（SDDC）。这些技术是一个更广泛趋势的一部分，通常被称为“软件定义一切”（SDX）。向软件定义基础设施的转变，旨在将执行数据交易和计算的硬件层与管理它们的软件层分离开来。

软件定义一切（SDX）目前的几个问题与挑战：

1. SDX的结构设计方法：细粒度与效率的权衡、虚拟化
2. SDX的可靠性和质量评估方法
3. SDX的安全性：新的安全协议与机制
4. 轻量级虚拟化：面向软件定义边缘计算
5. 旧系统向SDX的过渡
6. SDX的通用化：目前只是碎片化的软件定义网络/存储/云计算/数据中心，受限于传统IT基础硬件。

> For example, it is possible to offer software-defined data opening and sharing capabilities between many legacy systems without source code or documentation, which will facilitate the emergence of a new generation of IT systems in various areas, including government, enterprises, and corporations.

对于传统系统，无源代码无文档，则通过黑箱的方式进行包装，从而接入SDX的系统（北大燕云/Campus OS）

软件定义的进一步拓展：软件定义企业/城市/家庭/网际硬件。