---
title: "【论文笔记|009】Twine: A Unified Cluster Management System for Shared Infrastructure | Twine: 用于共享基础设施的统一集群管理系统"
date: 2024-07-30T21:53:53+08:00
tags:
- Computer systems organization
- Networks
- Software and its engineering
- Operating systems
- Distributed systems organizing principles
- +OSDI '20
---

[https://dl.acm.org/doi/10.5555/3488766.3488811](https://dl.acm.org/doi/10.5555/3488766.3488811)

# 论文作者

Chunqiang Tang, Kenny Yu, Kaushik Veeraraghavan, Jonathan Kaldor, Scott Michelson, Thawan Kooburat, Aravind Anbudurai, Matthew Clark, Kabir Gogia, Long Cheng, Ben Christensen, Alex Gartrell, Maxim Khutornenko, Sachin Kulkarni, Marcin Pawlowski, Tuomas Pelkonen, Andre Rodrigues, Rounak Tibrewal, Vaishnavi Venkatesan, and Peter Zhang, Facebook Inc.

# 摘要翻译

We present Twine, Facebook's cluster management system which has been running in production for the past decade. Twine has helped convert our infrastructure from a collection of siloed pools of customized machines dedicated to individual workloads, into a large-scale shared infrastructure with fungible hardware.

Our goal of ubiquitous shared infrastructure leads us to some decisions counter to common practices. For instance, rather than deploying an isolated control plane per cluster, Twine scales a single control plane to manage one million machines across all data centers in a geographic region and transparently move jobs across clusters.

Twine accommodates workload-specific customization in shared infrastructure, and this approach further departs from common practices. The TaskControl API allows an application to collaborate with Twine to handle container lifecycle events, e.g., restarting a ZooKeeper deployment's followers first and its leader last during a rolling upgrade. Host profiles capture hardware and OS settings that workloads can tune to improve performance and reliability; Twine dynamically allocates machines to workloads and switches host profiles accordingly.

Finally, going against the conventional wisdom of prioritizing stacking workloads on big machines to increase utilization, we universally deploy power-efficient small machines outfit with a single CPU and 64GB RAM to achieve higher performance per watt, and we leverage autoscaling to improve machine utilization.
We describe the design of Twine and share our experience in migrating Facebook's workloads onto shared infrastructure.

本篇论文介绍了 Twine，这是 Facebook 的集群管理系统，已经在生产环境中运行了十年。Twine 帮助我们将基础设施从一组专门用于单一工作负载的孤立机器池转变为具有可替代硬件的大规模共享基础设施。

我们的目标是实现无处不在的共享基础设施，这使我们做出了一些与常见做法相反的决策。例如，Twine 不是为每个集群部署一个独立的控制平面，而是扩展了单一控制平面来管理地理区域内所有数据中心中的一百万台机器，并能够透明地在集群之间移动作业。

Twine 在共享基础设施中适应特定工作负载的定制，这种方法进一步偏离了常见做法。TaskControl API 允许应用程序与 Twine 合作处理容器生命周期事件，例如，在滚动升级期间，首先重启 ZooKeeper 部署的跟随者，然后才是领导者。主机配置文件记录了工作负载可以调整以提高性能和可靠性的硬件和操作系统设置；Twine 动态地为工作负载分配机器并相应地切换主机配置文件。

最后，尽管通常优先将工作负载堆叠在大型机器上以提高利用率，我们却普遍部署了配备单个 CPU 和 64GB RAM 的节能小型机器，以实现更高的每瓦性能，并利用自动扩展来提高机器利用率。

本篇论文描述了 Twine 的设计，并分享了将 Facebook 的工作负载迁移到共享基础设施的经验。

# 笔记

目前已有的cluster集群管理软件如k8s存在一些问题：

1. 其往往关注独立的集群，对于跨集群的支持有限
2. 在管理应用程序的生命周期时，通常不会主动与应用程序沟通或获取其状态信息。这种缺乏沟通的情况下，可能会在不合适的时间进行操作，例如在应用程序尚未完成数据副本的创建时重启它，导致应用程序的数据无法访问，从而影响其可用性
3. 其往往不支持应用程序选择自己偏向的OS和硬件环境
4. 其经常倾向于在大型机（多CPU+大内存）上部署负载，但是如果管理出现问题则会导致低利用率和能量的浪费

> In this paper, we describe how we address the above limitations in Twine, Facebook’s cluster management system. Our two insights are 1) we scale a single Twine control plane to manage one million machines across data centers in a geographic region while providing high reliability and performance guarantees, and 2) we support workload-specific customization, which allows applications to run on shared infrastructure without sacrificing performance or capabilities.

在本文中，我们描述了如何在 Facebook 的集群管理系统 Twine 中解决上述限制：

1. 我们**扩展了单一的 Twine 控制平面来管理地理区域内数据中心的一百万台机器**，同时提供高可靠性和性能保障
2. 我们支持**特定工作负载的定制**，这使得应用程序可以在共享基础设施上运行，而不牺牲性能或功能

> Unlike Kubernetes Federation [25], Twine scales out natively without an additional federation layer.

# 词汇

fungible - 可替代的