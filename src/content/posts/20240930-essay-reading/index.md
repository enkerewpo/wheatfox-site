---
title: "【论文笔记|025】Llumnix: Dynamic Scheduling for Large Language Model Serving | Llumnix：服务LLM的动态调度 "
date: 2024-09-30T19:18:59+08:00
tags:
- LLM
- Scheduling
- +OSDI '24
---

## 摘要翻译

Inference serving for large language models (LLMs) is the key to unleashing their potential in people’s daily lives. However, efficient LLM serving remains challenging today because the requests are inherently heterogeneous and unpredictable in terms of resource and latency requirements, as a result of the diverse applications and the dynamic execution nature of LLMs. Existing systems are fundamentally limited in handling these characteristics and cause problems such as severe queuing delays, poor tail latencies, and SLO violations. 

We introduce Llumnix, an LLM serving system that reacts to such heterogeneous and unpredictable requests by runtime rescheduling across multiple model instances. Similar to context switching across CPU cores in modern operating systems, Llumnix reschedules requests to improve load balancing and isolation, mitigate resource fragmentation, and differentiate request priorities and SLOs. Llumnix implements the rescheduling with an efficient and scalable live migration mechanism for requests and their in-memory states, and exploits it in a dynamic scheduling policy that unifies the multiple rescheduling scenarios elegantly. Our evaluations show that Llumnix improves tail latencies by an order of magnitude, accelerates high-priority requests by up to 1.5×, and delivers up to 36% cost savings while achieving similar tail latencies, compared against state-of-theart LLM serving systems. Llumnix is publicly available at https://github.com/AlibabaPAI/llumnix.

推理服务对于大型语言模型（LLMs）来说，是释放其在日常生活中潜力的关键。然而，当前高效的LLM服务仍然面临挑战，因为请求在资源和延迟需求上本质上是异构且不可预测的，原因在于各种应用的多样性以及LLMs动态执行的特性。现有系统在处理这些特性时存在根本局限性，导致严重的排队延迟、较差的尾延迟以及服务水平目标（SLO）违反等问题。

我们介绍了Llumnix，这是一种LLM服务系统，能够通过在多个模型实例间的运行时重新调度，来应对这些异构和不可预测的请求。类似于现代操作系统中的CPU核心上下文切换，Llumnix通过重新调度请求来改善负载平衡与隔离，减少资源碎片化，并区分请求的优先级和SLO。Llumnix通过一种高效且可扩展的请求及其内存状态的动态迁移机制实现重新调度，并在一个动态调度策略中优雅地统一了多种重新调度场景。我们的评估显示，Llumnix将尾延迟改善了一个数量级，加速了高优先级请求最高1.5倍，并在与现有最先进LLM服务系统相比的情况下，以类似的尾延迟实现了高达36%的成本节省。Llumnix已在 https://github.com/AlibabaPAI/llumnix 开源。