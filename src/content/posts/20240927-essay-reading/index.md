---
title: "【论文笔记|022】sNPU: Trusted Execution Environments on Integrated NPUs | sNPU：集成NPU上的可信执行环境"
date: 2024-09-27T16:46:56+08:00
tags:
- Trusted Execution Environment
- FPGA
- GPU
- NPU
- +ISCA '24
---

https://ieeexplore.ieee.org/document/10609716

## 摘要翻译

Trusted execution environment (TEE) promises strong security guarantee with hardware extensions for security sensitive tasks. Due to its numerous benefits, TEE has gained widespread adoption, and extended from CPU-only TEEs to FPGA and GPU TEE systems. However, existing TEE systems exhibit inadequate and inefficient support for an emerging (and significant) processing unit, NPU. For instance, commercial TEE systems resort to coarse-grained and static protection approaches for NPUs, resulting in notable performance degradation (10%20%), limited (or no) multitasking capabilities, and suboptimal resource utilization. In this paper, we present a secure NPU architecture, known as sNPU, which aims to mitigate vulnerabilities inherent to the design of NPU architectures. First, sNPU proposes NPU Guarder to enhance the NPU’s access control. Second, sNPU defines new attack surfaces leveraging in-NPU structures like scratchpad and NoC, and designs NPU Isolator to guarantee the isolation of scratchpad and NoC routing. Third, our system introduces a trusted software module called NPU Monitor to minimize the software TCB. Our prototype, evaluated on FPGA, demonstrates that sNPU significantly mitigates the runtime costs associated with security checking (from upto 20% to 0%) while incurring less than 1% resource costs.

可信执行环境（TEE）通过硬件拓展的方式为安全敏感的任务提供强安全保证。由于其有诸多优点，目前TEE已经在众多领域进行了适配，从CPU到FPGA和GPU，然而，目前的TEE系统对新出现的（并且非常重要的）NPU的支持非常不足。例如，商业TEE系统对NPU采用粗粒度、静态保护的方式，使得其有明显的性能损失（10%至20%），少量（或没有）多任务能力，非最优的资源利用。

在本文中，我们提出了一个安全NPU架构——sNPU，其目标是减少（mitigate）NPU结构设计中的安全性问题。首先，sNPU提出【NPU Guarder】来加强NPU的访问控制。其次，sNPU利用NPU内的结构定义了新的攻击面，如scratchpad（Memory？）和NoC（片上网络），并且设计了【NPU Isolator】来保证内存和路由隔离。第三，我们的系统引入了一个可信软件模块，称为【NPU Monitor】，来最小化软件TCB（Trusted Computing Base，可信计算基）。我们的原型在FPGA上进行了严重，结果显示sNPU极大降低了安全检查相关的运行时开销（20%到0%），并且伴随小于1%的资源开销。

## 笔记

1. ISA TEE:
   1. Intel SGX/TDX
   2. AMD SEV
   3. ARM TrustZone/CCA
   4. RISC-V Penglai/Keystone
2. NPU相关的安全问题
   1. 用一个被恶意损坏的NPU来攻击CPU侧资源
   2. NPU支持多任务，恶意任务对NPU片内资源进行攻击（scrathpad）
   3. 使用CPU来攻击NPU
3. 结构：
   1. NPU Guarder：地址翻译，然后发给DMA
   2. NPU Isolator：scratchpad（SRAM）隔离、NoC保护
   3. NPU Monitor
4. chipyard做SoC
5. 测试：
   1. DNN：GoogleNe AlexNet YOLO-lite MobileNet ResNet Bert
6. 讨论：
   1. 目前只给sNPU区分了两个secure domain（secure/normal），如果要增加，需要在scratchpad资源进行取舍
   2. sNPU没做数据加密，只做了隔离
   3. sNPU主要针对itegraded NPU，没有PCIe相关设计