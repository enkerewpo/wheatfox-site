---
title: "【论文笔记|035】InfiniGen: Efficient Generative Inference of Large Language Models with Dynamic KV Cache Management | InfiniGen：具有动态KV缓存管理的大型语言模型高效生成推理"
date: 2024-10-11T19:06:26+08:00
tags:
- LLM Serving
- +OSDI '24
---

## 摘要翻译

Transformer-based large language models (LLMs) demonstrate impressive performance across various natural language processing tasks. However, serving LLM inference for generating long contents poses a challenge due to the enormous memory footprint of the transient state, known as the key-value (KV) cache, which scales with the sequence length and batch size. In this paper, we present InfiniGen, a novel KV cache management framework tailored for long-text generation, which synergistically works with modern offloading-based inference systems. InfiniGen leverages the key insight that a few important tokens essential for computing the subsequent attention layer in the Transformer can be speculated by performing minimal rehearsal with the inputs of the current layer and part of the query weight and key cache of the subsequent layer. This allows us to prefetch only the essential KV cache entries (without fetching them all), thereby mitigating the fetch overhead from the host memory in offloading-based LLM serving systems. Our evaluation on several representative LLMs shows that InfiniGen improves the overall performance of a modern offloading-based system by up to 3.00× compared to prior KV cache management methods while offering substantially better model accuracy.

基于Transformer的大型语言模型（LLMs）在各种自然语言处理任务中表现出色。然而，对于生成长文本的LLM推理，由于暂态状态（即键值缓存，KV缓存）的巨大内存占用，这一过程面临挑战，特别是随着序列长度和批处理大小的增加。本文提出了InfiniGen，一种专为长文本生成设计的新型KV缓存管理框架，能够与现代基于卸载的推理系统协同工作。InfiniGen的关键思想是，通过对当前层的输入和后续层的一部分查询权重与键缓存进行最小回放，可以推测出计算后续注意层所需的一些重要token。这使我们能够仅预取必要的KV缓存条目（而不是全部），从而减轻基于卸载的LLM服务系统中来自主机内存的提取开销。我们在多个代表性LLM上的评估表明，InfiniGen相比于先前的KV缓存管理方法，将现代卸载系统的整体性能提升了多达3.00倍，同时显著提高了模型准确性。