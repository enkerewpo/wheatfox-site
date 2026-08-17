---
title: "【论文笔记|037】FAERY: An FPGA-accelerated Embedding-based Retrieval System|FAERY：一种基于FPGA加速的嵌入式检索系统"
date: 2024-10-13T18:11:33+08:00
tags:
- FPGA
- +OSDI '22
---

Authors: 
Chaoliang Zeng, Hong Kong University of Science and Technology; Layong Luo, Qingsong Ning, Yaodong Han, and Yuhang Jiang, ByteDance; Ding Tang, Zilong Wang, and Kai Chen, Hong Kong University of Science and Technology; Chuanxiong Guo, ByteDance

## 摘要翻译

Embedding-based retrieval (EBR) is widely used in recommendation systems to retrieve thousands of relevant candidates from a large corpus with millions or more items. A good EBR system needs to achieve both high throughput and low latency, as high throughput usually means cost saving and low latency improves user experience. Unfortunately, the performances of existing CPU- and GPU-based EBR are far from optimal due to their inherent architectural limitations.

In this paper, we first study how an ideal yet practical EBR system works, and then design FAERY , an FPGA-accelerated EBR, which achieves the optimal performance of the practically ideal EBR system. FAERY is composed of three key components: It uses a high bandwidth HBM for memory bandwidth-intensive corpus scanning, a data parallelism approach for similarity calculation, and a pipeline-based approach for K-selection. To further reduce hardware resources, FAERY introduces a filter to early drop the non-Top-K items. Experiments show that the degraded FAERY with the same memory bandwidth of GPU still achieves 1.21×-12.27× lower latency and up to 4.29× higher throughput under a latency target of 10 ms than GPU-based EBR.

嵌入式检索（EBR）广泛应用于推荐系统中，用于从包含数百万或更多项的大型语料库中检索成千上万的相关候选项。一个好的EBR系统需要同时实现高吞吐量和低延迟，因为高吞吐量通常意味着降低成本，而低延迟则可以提升用户体验。然而，由于现有CPU和GPU架构的固有限制，当前的EBR系统性能远非最佳。在本文中，我们首先研究了一个理想且实用的EBR系统应如何运作，然后设计了FAERY，这是一种FPGA加速的EBR系统，能够实现实际上理想的EBR系统的最佳性能。FAERY由三个关键组件组成：它采用高带宽的HBM（高带宽内存）来进行内存带宽密集型的语料库扫描，使用数据并行的方法进行相似度计算，并采用基于流水线的方法进行K选择。为了进一步减少硬件资源，FAERY引入了一个过滤器，用于提前丢弃非Top-K项。实验表明，使用与GPU相同内存带宽的FAERY降级版本仍能在10毫秒延迟目标下，比基于GPU的EBR实现1.21倍至12.27倍的低延迟，并能实现高达4.29倍的吞吐量。