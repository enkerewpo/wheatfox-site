---
title: "【论文笔记|019】Survey of Machine Learning Accelerators ： 机器学习加速器调查"
date: 2024-09-20T12:18:32+08:00
tags:
- Machine Learning
- Accelerators
- +IEEE Design & Test '22
---

# 摘要翻译

New machine learning accelerators are being announced and released each month for a variety of applications from speech recognition, video object detection, assisted driving, and many data center applications. This paper updates the survey of of AI accelerators and processors from last year’s IEEEHPEC paper. This paper collects and summarizes the current accelerators that have been publicly announced with performance and power consumption numbers. The performance and power values are plotted on a scatter graph and a number of dimensions and observations from the trends on this plot are discussed and analyzed. For instance, there are interesting trends in the plot regarding power consumption, numerical precision, and inference versus training. This year, there are many more announced accelerators that are implemented with many more architectures and technologies from vector engines, dataflow engines, neuromorphic designs, flash-based analog memory processing, and photonic-based processing.

新的机器学习加速器每个月都在为语音识别、视频目标检测、辅助驾驶以及许多数据中心应用等领域被宣布和发布。本文更新了去年IEEE HPEC论文中的AI加速器和处理器调查。本文收集并总结了当前公开发布的加速器的性能和功耗数据。性能和功耗数值被绘制成散点图，并对该图中的多维度趋势进行了讨论和分析。例如，图中关于功耗、数值精度以及推理与训练之间存在一些有趣的趋势。今年宣布的加速器更多，并且采用了更多的架构和技术，包括矢量引擎、数据流引擎、神经形态设计、基于闪存的模拟存储处理和基于光子的处理。

# 笔记

计算机系统研究的一些体会-陈海波（ChinaSys分享）

## 趋势1：从分层解耦到垂直整合，需要重新定义系统软件栈

- 操作系统发展：专用 -> 通用 -> 专用(定制)?
   - “I think there is a world market for maybe five computers.” 
     - Thomas Watson, president of IBM, 1943
   - 计算机系统正在从**传统的分层解耦**走向**云 + 端的垂直整合**
   
- “Any problem in computer science can be solved with another level of indirection, except of course for the problem of too many indirections”  
   - Butler Lampson/David Wheeler
   
- **机会：** 跨层设计重新定义系统软件栈

## 趋势2：后摩尔时代的三堵墙需要新的软硬件协同

- 编程墙
   - 后摩尔时代：单核 → 多核 → 异构多核

- 功耗墙
   - Dennard scaling 定律失效
   - 工艺提升不再能保证功耗不增加

- 效用墙
   - 功耗约束不能使能所有算力
   - 如何在功耗约束下最大化芯片算力

## 机遇：软硬协同解决后摩尔时代的三堵墙

- **广义的协同方法：**
   1. 使用软件（硬件）设计理念构建硬件（软件）
   2. 充分挖掘和利用硬件已有特性
   3. 扩展硬件性并与软件协同完成任务

## 趋势3：基于数据驱动的软件优化方法从软件1.0到软件2.0

### 机遇
以数据为中心构建软件系统提高处理效能

- 大数据分析结构化数据
- 网络应用用户数据
- 智能应用训练数据
- 无人驾驶实时图像数据和路况数据
- 图像视频应用图像数据

#### 软件1.0

* Input: Algorithms in code
* Compiled to: Machine instructions

#### 软件2.0

* Input: Training data
* Compiled to: Learned parameters


## 趋势4：新时代应用模式的变化呼唤新的系统软件抽象与管理 

### 应用模式的变化：
从文档抽象到应用容器到云原生 

### 需要新的系统软件抽象与运行支撑 

## 趋势5：计算体系统结构变化需要新的系统软件架构

### 计算体系统结构的变化

1. 新型大容量、非易失内存的出现将替代传统硬盘
2. 从三层（硬盘、内存、CPU）变为主要两层（内存，xPU）
3. 异构加速硬件繁荣使得从CPU-centric计算到分布式协作计算

### 新型计算体系统结构需要新的系统软件架构

#### 传统架构
- CPU Cache
- DRAM
- 闪存/硬盘

#### 演进中的新架构
- 非易失储/NVM/NVM/DRAM 
- 网卡缓存 xPU Cache

## 趋势6：从CPU为中心到DSA与智能设备崛起，需要重构系统软件

### DSA的崛起：CPU为中心 -> xPU分布计算
- Nvidia（市值3357亿美元）v.s. Intel（市值2130亿美元）

### 智能设备逐步崛起
- 允许将一部分软件功能卸载至智能设备（如网卡）之中
  - 卸载的软件可直接处理网络数据，减少与Host处理器交互

### 系统软件需要考虑计算的分布式
- NDP, PIM 
- Disaggregated computing 