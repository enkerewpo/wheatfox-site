---
title: "【论文笔记|016】CrowdOS: A Ubiquitous Operating System for Crowdsourcing and Mobile Crowd Sensing | CrowdOS：一种用于众包和移动群体感知的普适操作系统"
date: 2024-08-27T17:42:09+08:00
tags:
- Operating system
- ubiquitous operating systems
- +IEEE Transactions on Mobile Computing '20
---

# 摘要翻译

With the rise of crowdsourcing and mobile crowdsensing techniques, a large number of crowdsourcing applications or platforms (CAP) have appeared. In the mean time, CAP-related models and frameworks based on different research hypotheses are rapidly emerging, and they usually address specific issues from a certain perspective. Due to different settings and conditions, different models are not compatible with each other. However, CAP urgently needs to combine these techniques to form a unified framework. In addition, these models needs to be learned and updated online with the extension of crowdsourced data and task types, thus requiring a unified architecture that integrates lifelong learning concepts and breaks down the barriers between different modules. This paper draws on the idea of ubiquitous operating systems and proposes a novel OS (CrowdOS), which is an abstract software layer running between native OS and application layer. In particular, based on an in-depth analysis of the complex crowd environment and diverse characteristics of heterogeneous tasks, we construct the OS kernel and three core frameworks including Task Resolution and Assignment Framework (TRAF ), Integrated Resource Management (IRM), and Task Result quality Optimization (TRO). In addition, we validate the usability of CrowdOS, module correctness and development efficiency. Our evaluation further reveals TRO brings enormous improvement in efficiency and a reduction in energy consumption.

随着众包和移动群体感知技术的兴起，大量众包应用或平台（CAP）相继出现。同时，基于不同研究假设的CAP相关模型和框架也迅速涌现，通常从特定的视角解决具体问题。由于设置和条件的不同，不同模型之间往往不兼容。然而，CAP迫切需要将这些技术结合起来，形成一个统一的框架。此外，这些模型还需要随着众包数据和任务类型的扩展进行在线学习和更新，因此需要一个统一的架构，整合终身学习的概念，并打破不同模块之间的障碍。本文借鉴了普适操作系统的理念，提出了一种新型操作系统（CrowdOS），它是一个运行在原生操作系统和应用层之间的抽象软件层。特别是，通过对复杂的群体环境和异构任务的多样性特征进行深入分析，我们构建了操作系统内核和三个核心框架，包括任务分解与分配框架（TRAF）、集成资源管理（IRM）、和任务结果质量优化（TRO）。此外，我们验证了CrowdOS的可用性、模块正确性和开发效率。我们的评估进一步揭示了TRO在效率提升和能耗降低方面带来了巨大改进。

<!-- # 笔记 -->
