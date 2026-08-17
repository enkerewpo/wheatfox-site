---
title: "【论文笔记|006】Triton: an intermediate language and compiler for tiled neural network computations | Triton：用于块状神经网络计算的中间语言和编译器"
date: 2024-07-24T15:02:54+08:00
tags:
- Computing methodologies
- Neuro Network
- LLVM
- +MAPL '19
---

[https://openai.com/index/triton/](https://openai.com/index/triton/)

Introducing Triton: Open-source GPU programming for neural networks - OpenAI

MAPL 2019: Proceedings of the 3rd ACM SIGPLAN International Workshop on Machine Learning and Programming Languages
June 2019
Pages 10 - 19

[https://doi.org/10.1145/3315508.3329973](https://doi.org/10.1145/3315508.3329973)

# 论文作者

Philippe Tillet, H. T. Kung, and David Cox

# 摘要翻译

The validation and deployment of novel research ideas in the field of Deep Learning is often limited by the availability of efficient compute kernels for certain basic primitives. In particular, operations that cannot leverage existing vendor libraries (e.g., cuBLAS, cuDNN) are at risk of facing poor device utilization unless custom implementations are written by experts – usually at the expense of portability. For this reason, the development of new programming abstractions for specifying custom Deep Learning workloads at a minimal performance cost has become crucial.

We present Triton, a language and compiler centered around the concept of tile, i.e., statically shaped multi-dimensional sub-arrays. Our approach revolves around (1) a C-based language and an LLVM-based intermediate representation (IR) for expressing tensor programs in terms of operations on parametric tile variables and (2) a set of novel tile-level optimization passes for compiling these programs into efficient GPU code. We demonstrate how Triton can be used to build portable implementations of matrix multiplication and convolution kernels on par with hand-tuned vendor libraries (cuBLAS / cuDNN), or for efficiently implementing recent research ideas such as shift convolutions.

在深度学习领域中，新研究理念的验证和部署常常受到某些基本原语的高效计算内核可用性的限制。特别是，那些无法利用现有供应商库（例如，cuBLAS、cuDNN）的操作，可能会面临设备利用率低下的风险，除非由专家编写定制实现——但这通常以牺牲可移植性为代价。为此，开发新的编程抽象以在尽可能小的性能成本下指定定制深度学习工作负载变得至关重要。

我们介绍了 Triton，这是一种围绕 tile 概念（即静态形状的多维子数组）构建的语言和编译器。我们的方法包括：（1）基于 C 的语言和基于 LLVM 的中间表示（IR），用于通过操作参数化 tile 变量来表达张量程序，以及（2）一组新颖的 tile 级优化过程，用于将这些程序编译成高效的 GPU 代码。我们展示了如何使用 Triton 构建可移植的矩阵乘法和卷积内核实现，性能与手工优化的供应商库（cuBLAS / cuDNN）相当，或用于高效实现最近的研究理念，例如 shift 卷积。

# 点评

目前有诸多面向DNN的领域特性语言（DSL），如Tensor Comprehension、Halide、TVM、PlaidML），但是这些语言的缺点是性能往往比不上cuBLAS等供应商提供的编程库。

> These issues have often been addressed by the use of micro-kernels [11, 21] – i.e., hand-written tile-level intrinsics – but this solution requires a lot of manual labor and lacks portability. And while several high-level programming abstractions for tiling have recently been proposed [23, 41], underlying compiler backends still lack support for tile-level operations and optimizations. To this end we present Triton (Figure 2), an open-source1 intermediate language and compiler for specifying and compiling tile programs into efficient GPU code.

> "Tiled neural network" 是一种通过将神经网络计算任务划分为较小的块来提高计算效率的方法。通过对输入数据、权重或输出进行块划分，可以更有效地利用硬件的内存层次结构和并行计算能力。这种方法有助于减少内存访问开销，提高缓存利用率，并能够充分利用 GPU 等硬件的并行处理能力。块状计算还允许根据硬件平台调整块的大小和形状，以实现最佳性能优化，尤其适用于需要大量矩阵运算的卷积神经网络（CNN）等模型。

Triton的总结构：Triton-C $\rightarrow$ Triton-IR $\rightarrow$ Triton-JIT。对于相关工作，这种DSL编译器主要有三个设计思路：

> • **Tensor-level IRs** have been used by XLA [16] and Glow [38] to transform tensor programs into predefined LLVM-IR and CUDA-C operation templates (e.g., tensor contractions, element-wise operations, etc.) using pattern-matching. 

> • **The polyhedral model** [18] has been used by Tensor Comprehensions (TC) [43] and Diesel [14] to parameterize and automate the compilation of one or many DNN layers into LLVM-IR and CUDA-C programs. 

> • **Loop synthesizers** have been used by Halide [37] and TVM [10] to transform tensor computations into loop nests that can be manually optimized using userdefined (though possibly parametric [11]) schedules.

XLA 和 Glow 等张量级中间表示（IR）使用模式匹配将张量程序转换为预定义的 LLVM-IR 和 CUDA-C 模板，例如张量收缩和逐元素操作。Tensor Comprehensions（TC）和 Diesel 使用的多面体模型能够参数化和自动化地将深度神经网络（DNN）层编译为 LLVM-IR 和 CUDA-C 程序。Halide 和 TVM 使用循环合成器，将张量计算转换为循环嵌套，可以通过用户定义的调度（可能是参数化的）进行手动优化。

下面是Triton-IR（基于LLVM-IR）实现的relu：

```llvm
define kernel void @relu(float* %A, i32 %M, i32 %N) {
prologue:
    ; 获取全局范围的第一个维度（通常对应于线程块的大小）
    %rm = call i32 <8> get_global_range(0)
    
    ; 获取全局范围的第二个维度
    %rn = call i32 <8> get_global_range(1)

    ; 广播形状，将标量 %M 重新调整为 8x8 的张量，并广播其值
    %1 = reshape i32 <8, 8> %M
    %M0 = broadcast i32 <8, 8> %1

    ; 广播形状，将标量 %N 重新调整为 8x8 的张量，并广播其值
    %2 = reshape i32 <8, 8> %N
    %N0 = broadcast i32 <8, 8> %2

    ; 广播全局范围，重新调整 %rm 为 8x1 的张量，并广播其值
    %3 = reshape i32 <8, 1> %rm
    %rm_bc = broadcast i32 <8, 8> %3

    ; 广播全局范围，重新调整 %rn 为 1x8 的张量，并广播其值
    %4 = reshape i32 <1, 8> %rn
    %rn_bc = broadcast i32 <8, 8> %4

    ; 计算掩码，检查 rm_bc 是否小于 M0，以确保在范围内
    %pm = icmp slt %rm_bc, %M0
    
    ; 计算掩码，检查 rn_bc 是否小于 N0，以确保在范围内
    %pn = icmp slt %rn_bc, %N0
    
    ; 组合掩码，确保两个维度都在范围内
    %msk = and %pm, %pn

    ; 计算指针，首先将 %A 的地址扩展为 8x8 的张量
    %A0 = splat float* <8, 8> %A

    ; 基于广播的 rm_bc 计算指针偏移
    %5 = getelementptr %A0, %rm_bc

    ; 计算基于广播的 rn_bc 和 M0 的乘积
    %6 = mul %rn_bc, %M0
    
    ; 计算最终指针位置
    %pa = getelementptr %5, %6

    ; 从计算出的指针位置加载值
    %a = load %pa
    
    ; 将 0 扩展为 8x8 的张量
    %_0 = splat float <8, 8> 0
    
    ; 计算 ReLU 操作，取 %a 和 %_0 中较大的值
    %result = max float %a, %_0

    ; 将结果写回到内存中的 %pa 位置
    store fp32 <8, 8> %pa, %result
}
```

对于JIT后端，其实现了两类优化Pass:

1. 机器无关优化：Pre-Fetching、Tile-Level Peephole Optimization
2. 机器相关优化：Hierarchical Tiling、Memory Coalescing、Shared Memory Allocation、Shared Memory Synchronization

除此之外Triton-JIT还实现了自动调优（Auto-tuner）。从最后的实现来看，Triton在Square、DeepSpeech2和Transformer的效果上接近cuBLAS。

# 词汇

Kernel - 在神经网络中，"kernel" 是用于执行卷积运算的小矩阵，通过在输入数据上滑动来提取特征，如图像的边缘和纹理。