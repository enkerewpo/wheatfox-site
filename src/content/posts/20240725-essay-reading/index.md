---
title: "【论文笔记|007】Toward Ubiquitous Operating Systems: A Software-Defined Perspective | 迈向泛在操作系统：一种软件定义的视角"
date: 2024-07-25T17:52:59+08:00
tags:
- Operating Systems
- Software-Defined Everything
---

January 2018 Computer 51(1):50-56.51(1):50-56. http://dx.doi.org/10.1109/MC.2018.1151018

# 文章作者

Hong Mei, Yao Guo, Peking University


# 摘要翻译

In recent years, operating systems have expanded beyond traditional computing systems into the cloud, IoT devices, and other emerging technologies and will soon become ubiquitous. Despite the apparent differences among existing OSs, they all have in common so-called “software-defined” capabilities–namely, resource virtualization and function programmability.

近年来，操作系统已从传统计算系统扩展到云计算、物联网设备和其他新兴技术，并很快将变得无处不在。尽管现有操作系统之间存在明显差异，但它们都有一个共同点，即所谓的“软件定义”功能——即资源虚拟化和功能可编程性。

# 笔记

> Resource virtualization and function programmability also lie at the heart of so-called “software-defined” systems including software-defined networks (SDNs),2 software-defined storage (SDS), and software-defined datacenters (SDDCs). Just as a traditional OS manages a hardware system with software abstractions and provides runtime support for applications, we believe that future OSs will provide all of the software-defined capabilities for emerging technologies. Thus, an SDN is an OS for networking hardware, while a software-defined cloud is an OS for the cloud. We refer to these OSs as ubiquitous operating systems (UOSs).

文章开头对泛在操作系统给出了具体的例子：软件定义网络、软件定义云、软件定义存储，并且给出了传统操作系统和新的软件定义一切（SDX）的关系：

| Operating Systems           | SDX (software-defined everything)              |
|-----------------------------|------------------------------------------------|
| Desktop OSs (Linux/Windows) | Software-defined desktop computers             |
| TinyOS                      | Software-defined wireless sensor network motes |
| Cloud OS                    | Software-defined cloud                         |
| OS for networks             | SDNs (software-defined networks)               |
| OS for storage systems      | SDS (software-defined storage)                 |
| OS for datacenters          | SDDCs (software-defined datacenters)           |

泛在操作系统的特征是**硬件资源虚拟化**+**功能可编程**。

之后文章在UBIQUITOUS OPERATING SYSTEMS小节列举了一些泛在操作系统实例；

1. **Web OSs**，例如Firefox OS、Chrome OS、eye OS、YouOS
2. **ROS**，即机器人操作系统
3. **HomeOS**，来自微软
4. **City OSs**，如Living PlanIT Urban Operating System (living-planit.com)
5. **Cloud OSs**，如微软的Azure、亚马逊的AWS、OpenStack、CloudStack
6. **IoT OSs**，如Google的Android Things (Brillo)

用于真实和虚拟实体以及传统 IT 系统的不同类别的泛在操作系统：

<div style="max-width: 100%; overflow-x: auto;">
<svg width="100%" viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="50%" cy="50%" rx="50%" ry="40%" fill="lightsteelblue" stroke="black"></ellipse>
  <text x="50%" y="17%" text-anchor="middle" font-size="24px" fill="white" font-weight="bold">OSs for the virtual world</text>
  <ellipse cx="50%" cy="50%" rx="35%" ry="28%" fill="lightyellow" stroke="black"></ellipse>
  <text x="50%" y="32%" text-anchor="middle" font-size="20px" fill="black" font-weight="bold">OSs for the physical world</text>
  <ellipse cx="50%" cy="50%" rx="20%" ry="15%" fill="lightcyan" stroke="black"></ellipse>
  <text x="50%" y="48%" text-anchor="middle" font-size="18px" fill="black" font-weight="bold">OSs for IT systems</text>
  <text x="20%" y="26%" text-anchor="middle" font-size="11px" fill="black">Campus OS</text>
  <text x="35%" y="23%" text-anchor="middle" font-size="11px" fill="black">City OS</text>
  <text x="50%" y="20%" text-anchor="middle" font-size="11px" fill="black">Enterprise OS</text>
  <text x="65%" y="23%" text-anchor="middle" font-size="11px" fill="black">Personal OS</text>
  <text x="80%" y="26%" text-anchor="middle" font-size="11px" fill="black">Social network OS</text>
  <text x="85%" y="29%" text-anchor="middle" font-size="11px" fill="black">Family OS</text>
  <text x="30%" y="40%" text-anchor="middle" font-size="11px" fill="black">Robot OS</text>
  <text x="25%" y="45%" text-anchor="middle" font-size="11px" fill="black">IoT OS</text>
  <text x="22%" y="50%" text-anchor="middle" font-size="11px" fill="black">Manufacturing OS</text>
  <text x="70%" y="40%" text-anchor="middle" font-size="11px" fill="black">Home OS</text>
  <text x="75%" y="45%" text-anchor="middle" font-size="11px" fill="black">Building OS</text>
  <text x="80%" y="50%" text-anchor="middle" font-size="11px" fill="black">Vehicle OS</text>
  <text x="50%" y="52%" text-anchor="middle" font-size="11px" fill="black">Embedded OS</text>
  <text x="50%" y="54%" text-anchor="middle" font-size="11px" fill="black">Desktop OS</text>
  <text x="50%" y="56%" text-anchor="middle" font-size="11px" fill="black">Server OS</text>
  <text x="50%" y="58%" text-anchor="middle" font-size="11px" fill="black">Cloud OS</text>
  <text x="50%" y="60%" text-anchor="middle" font-size="11px" fill="black">Big data OS</text>
  <text x="50%" y="62%" text-anchor="middle" font-size="11px" fill="black">Internet OS</text>
  <text x="50%" y="64%" text-anchor="middle" font-size="11px" fill="black">AI OS</text>
</svg>
</div>

UOS类别：

1. **大数据操作系统**：
   - 为各种领域构建。
   - 提供数据抽象和管理的特殊功能。
   - 提供数据访问和管理API、编程模型和语言，用于大数据应用。

2. **企业操作系统**：
   - 支持高效管理流程、资源、人员和机器。
   - 可以从现有企业系统（如MIS或ERP）中创建，通过编程API支持灵活的应用开发。

3. **工业/制造业操作系统**：
   - 支持先进的生产和机器人控制系统。
   - 提供软件定义的抽象和通信能力，以提高效率和智能。

4. **人类-网络-物理（人机物融合）操作系统**：
   - 融合网络物理系统、人类和物理世界。
   - 需要新的软件定义的抽象和能力，用于系统管理、应用开发和通信。

5. **人工智能操作系统**：
   - 提供机器学习或深度学习能力的抽象。
   - 支持AI应用。

## INTERNETWARE OS

> Internetware is a paradigm for new types of Internet applications that are autonomous, cooperative, situational, evolvable, and trustworthy.10,11 Internetware consists of a set of autonomous software entities distributed over the Internet, together with a set of connectors to enable various collaborations among these entities. Software entities sense dynamic changes in the runtime environment and continuously adapt to them through structural and behavioral evolutions.

> 互联网软件是一种新型互联网应用的范式，这些应用具有自主性、合作性、情境性、可演化性和可信任性。互联网软件由分布在互联网中的一组自主软件实体以及一组用于这些实体之间各种合作的连接器组成。软件实体能够感知运行时环境中的动态变化，并通过结构和行为的演变不断适应这些变化。

With rapid IoT development, many UOSs will emerge to provide software-defined capabilities, especially resource virtualization and function programmability, to support the efficient deployment and management of new types of ubiquitous applications. However, several key technical challenges still must be resolved with respect to UOS architecture, system performance, and security and privacy. Nonetheless, we foresee UOSs appearing in various computing and computer-assisted domains including robotics, enterprise computing, manufacturing, big data, and AI. Toward this end, our future work includes developing Internetware OSs for new areas such as unmanned systems, industrial control, and brain-like computing.

随着物联网（IoT）的快速发展，许多泛在操作系统（UOS）将出现，以提供软件定义的功能，特别是资源虚拟化和功能可编程性，以支持新型普适应用的高效部署和管理。然而，关于UOS架构、系统性能以及安全和隐私方面，仍然需要解决一些关键技术挑战。尽管如此，我们预计UOS将在机器人技术、企业计算、制造业、大数据和人工智能等各个计算和计算机辅助领域中出现。为此，我们未来的工作包括为无人系统、工业控制和类脑计算等新领域开发互联网软件操作系统。