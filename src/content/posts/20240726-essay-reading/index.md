---
title: "【论文笔记|008】ROS: an open-source Robot Operating System | ROS：一个开源机器人操作系统"
date: 2024-07-26T12:11:10+08:00
tags:
- Operating Systems
- Middlewares
- +ICRA Workshop '09
---

January 2009 3 Conference: ICRA Workshop on Open Source Software

[https://www.ros.org/](https://www.ros.org/)

[http://robotics.stanford.edu/~ang/papers/icraoss09-ROS.pdf](http://robotics.stanford.edu/~ang/papers/icraoss09-ROS.pdf)

# 论文作者

Morgan Quigley, Brian Gerkey, Ken Conley, Josh Faust, Tully Foote, Jeremy Leibs, Eric Berger, Rob Wheeler, Andrew Ng

Stanford University, Willow Garage, University of Southern California

# 摘要翻译

This paper gives an overview of ROS, an opensource robot operating system. ROS is not an operating system in the traditional sense of process management and scheduling; rather, it provides a structured communications layer above the host operating systems of a heterogenous compute cluster. In this paper, we discuss how ROS relates to existing robot software frameworks, and briefly overview some of the available application software which uses ROS.

这篇论文概述了 ROS，一种开源机器人操作系统。ROS 并不是传统意义上负责进程管理和调度的操作系统；而是为异构计算集群的主机操作系统提供了一个结构化的通信层。在本文中，我们讨论了 ROS 与现有机器人软件框架的关系，并简要概述了一些使用 ROS 的应用软件。

# 笔记

> The philosophical goals of ROS can be summarized as: 
>
> Peer-to-peer, Tools-based, Multi-lingual, Thin, Free and Open-Source

## P2P

ROS为了避免传统中心服务器通过WLAN交互较慢的问题，采用P2P通信，而不是On-board和Off-board各自组网，然后通过无线网络通信。（为什么P2P可以解决这个问题？）

> ROS 采用 P2P 通信是为了避免传统中心服务器模式下通过 WLAN 交互较慢的问题。在中心服务器模式中，所有数据传输都必须通过一个单一的服务器，这可能导致延迟增加和带宽的浪费。而 P2P 通信允许机器人和组件之间直接进行数据交换，消除了中心服务器的中介作用，从而减少了通信延迟。此外，P2P 通信可以提高系统的鲁棒性和可扩展性，因为即使某个节点出现故障，其它节点仍然可以通过直接连接进行通信。这种方式还可以更高效地利用网络带宽，避免因中心服务器负载过重导致的性能瓶颈。因此，P2P 通信更适合动态变化和节点数量较多的机器人网络环境。

> 在 ROS 中，P2P 通信通过发布-订阅模型和服务调用机制来实现高效的数据交换。发布-订阅模型允许节点成为发布者或订阅者，通过直接在主题上发布或接收消息，从而实现点对点的数据流，减少了延迟。服务调用机制支持节点之间的同步请求和响应通信，进一步支持直接连接。虽然 ROS 使用 ROS Master 来进行节点的注册和发现，但一旦节点完成注册，它们可以直接通信而无需中心服务器的参与。此外，ROS 支持 TCP 和 UDP 协议，分别用于可靠传输和低延迟场景，从而提升网络效率。这种 P2P 通信机制使 ROS 能够在机器人网络中实现实时、可靠的协作和信息共享。

ROS支持多种语言编程：

> ROS currently supports four very different languages: C++, Python, Octave, and LISP, with other language ports in various states of completion.

具体是通过IDL（Interface Definition Language）实现的：

> To support cross-language development, ROS uses a simple, language-neutral interface definition language (IDL) to describe the messages sent between modules.
> The IDL uses (very) short text files to describe fields of each message, and allows composition of messages, as illustrated by the complete IDL file for a point cloud message:  

```
Header header
Point32[] pts
ChannelFloat32[] chan
```

> Code generators for each supported language then generate native implementations which “feel” like native objects, and are automatically serialized and deserialized by ROS as messages are sent and received.

ROS在设计时也采用了类似“微内核”的概念，许多功能不放在框架中，而是通过工具的方式实现。ROS设计的几个重要概念：

**节点 (Nodes)**
节点是 ROS 中执行计算的基本进程。ROS 被设计为细粒度的模块化系统，这意味着一个系统通常由多个节点组成。在这个上下文中，“节点”可以与“软件模块”互换使用。节点可以被可视化为图中的节点，节点之间的点对点通信被表示为弧线。

**消息 (Messages)**
节点通过传递消息进行通信。消息是严格类型的数据结构，支持标准的基本类型，如整数、浮点、布尔值等。消息也可以是这些基本类型和常量的数组，或由其他消息组成，可以任意深度嵌套。

**主题 (Topics)**
节点通过将消息发布到特定的主题来发送消息。主题由一个字符串标识，如“odometry”或“map”。对某种数据感兴趣的节点将订阅相应的主题。在一个主题中，可以有多个发布者和订阅者，并且一个节点可以发布和/或订阅多个主题。发布者和订阅者通常不了解彼此的存在。

**服务 (Services)**
话题发布-订阅模型虽然在通信中很灵活，但其“广播”路由机制并不适合同步事务，这可能会简化某些节点的设计。在ROS（机器人操作系统）中，这种机制被称为服务（service），由一个字符串名称和一对严格类型的消息定义：一个用于请求，一个用于响应。这类似于Web服务，Web服务由URI定义，并有一对类型明确的请求和响应文档。值得注意的是，与话题不同，一个名称的服务只能由一个节点发布。例如，只能有一个名为“classify image”的服务，就像每个URI只能对应一个Web服务一样。

**包 (Packages)**
由于机器人技术和人工智能的广泛范围，研究人员之间的合作是构建大型系统所必需的。为了支持协作开发，ROS软件系统被组织成包（packages）。我们对“包”的定义故意保持开放：一个ROS包只是一个包含XML文件的目录，该文件描述了包的信息并列出了任何依赖关系。

## References

1. J. Kramer and M. Scheutz, “Development environments for autonomous mobile robots: A survey,” Autonomous Robots, vol. 22, no. 2, pp. 101–132, 2007.
   - J. Kramer 和 M. Scheutz, “自主移动机器人开发环境的调查”，《自主机器人》，第22卷，第2期，第101–132页，2007年。

2. M. Quigley, E. Berger, and A. Y. Ng, “STAIR: Hardware and Software Architecture,” in AAAI 2007 Robotics Workshop, Vancouver, B.C, August, 2007.
   - M. Quigley, E. Berger 和 A. Y. Ng, “STAIR: 硬件和软件架构”，在AAAI 2007机器人研讨会，温哥华，B.C，2007年8月。

3. K. Wyobek, E. Berger, H. V. der Loos, and K. Salisbury, “Towards a personal robotics development platform: Rationale and design of an intrinsically safe personal robot,” in Proc. of the IEEE Intl. Conf. on Robotics and Automation (ICRA), 2008.
   - K. Wyobek, E. Berger, H. V. der Loos 和 K. Salisbury, “迈向个人机器人开发平台：内在安全个人机器人的理由与设计”，在IEEE国际机器人与自动化大会（ICRA）论文集中，2008年。

4. M. Montemerlo, N. Roy, and S. Thrun, “Perspectives on standardization in mobile robot programming: The Carnegie Mellon Navigation (CARMEN) Toolkit,” in Proc. of the IEEE/RSJ Intl. Conf. on Intelligent Robots and Systems (IROS), Las Vegas, Nevada, Oct. 2003, pp. 2436–2441.
   - M. Montemerlo, N. Roy 和 S. Thrun, “移动机器人编程中的标准化视角：卡内基梅隆导航（CARMEN）工具包”，在IEEE/RSJ国际智能机器人与系统大会（IROS）论文集中，拉斯维加斯，内华达州，2003年10月，第2436–2441页。

5. A. Makarenko, A. Brooks, and T. Kaupp, in Proc. of the IEEE/RSJ Intl. Conf. on Intelligent Robots and Systems (IROS), Nov. 2007.
   - A. Makarenko, A. Brooks 和 T. Kaupp, 在IEEE/RSJ国际智能机器人与系统大会（IROS）论文集中，2007年11月。

6. R. T. Vaughan and B. P. Gerkey, “Reusable robot code and the Player/Stage Project,” in Software Engineering for Experimental Robotics, ser. Springer Tracts on Advanced Robotics, D. Brugali, Ed. Springer, 2007, pp. 267–289.
   - R. T. Vaughan 和 B. P. Gerkey, “可重用的机器人代码与Player/Stage项目”，在《实验机器人学的软件工程》中，Springer高级机器人系列，D. Brugali主编，Springer，2007年，第267–289页。

7. G. Bradski and A. Kaehler, Learning OpenCV, Sep. 2008.
   - G. Bradski 和 A. Kaehler, 《学习OpenCV》，2008年9月。

8. R. Diankov and J. Kuffner, “The robotic busboy: Steps towards developing a mobile robotic home assistant,” in Intelligent Autonomous Systems, vol. 10, 2008.
   - R. Diankov 和 J. Kuffner, “机器人服务员：开发移动机器人家用助手的步骤”，在《智能自主系统》第10卷，2008年。

9. J. Jackson, “Microsoft robotics studio: A technical introduction,” in IEEE Robotics and Automation Magazine, Dec. 2007, http://msdn.microsoft.com/en-us/robotics.
   - J. Jackson, “微软机器人工作室：技术介绍”，在《IEEE机器人与自动化杂志》，2007年12月，http://msdn.microsoft.com/en-us/robotics。

10. O. Michel, “Webots: a powerful realistic mobile robots simulator,” in Proc. of the Second Intl. Workshop on RoboCup. Springer-Verlag, 1998.
    - O. Michel, “Webots：一种强大的现实移动机器人模拟器”，在第二届RoboCup国际研讨会论文集中，Springer-Verlag，1998年。


# 词汇

nomenclature - (尤指某学科的)命名法、术语