---
title: "【论文笔记|014】Operating Systems for Internetware: Challenges and Future Directions|面向互联网软件的操作系统：挑战与未来方向"
date: 2024-08-25T16:11:04+08:00
tags:
- Internetware
- Operating system
- software-defined everything
- ubiquitous operating systems
---

https://www.researchgate.net/publication/326561880_Operating_Systems_for_Internetware_Challenges_and_Future_Directions

Hong Mei, Yao Guo, Peking University

# 摘要翻译

An operating system is an essential layer of system software that is responsible for resource management and application support on a computer system. As the evolvement of computer systems, the concept of OSs has also been evolved into many new forms beyond the traditional OSs such as Linux and Windows. We call this new generation of OSs as ubiquitous operating systems (UOSs). Among many new types of UOSs, we are particularly interested in the operating systems for Internetware, i.e., Internetware Operating Systems. Internetware is a paradigm for new types of Internet applications that are autonomous, cooperative, situational, evolvable, and trustworthy. An Internetware OS represents our perspective on the OS for future Internetbased applications. This paper discusses the examples, technical challenges and our recent effort on Internetware OSs, as well as our vision on the future of Internetware OSs. We believe that, in the foreseeable future, Internetware OSs will become ubiquitous and could be built for many different types of computer systems and beyond.

操作系统是计算机系统中负责资源管理和应用支持的重要系统软件层。随着计算机系统的发展，操作系统的概念也逐渐演变出了许多新的形式，不再局限于传统的操作系统如 Linux 和 Windows。我们称这种新一代的操作系统为泛在操作系统（UOSs）。在众多新型泛在操作系统中，我们特别关注互联网软件的操作系统，即互联网软件操作系统。互联网软件是一种新的互联网应用范式，它具有自主性、协作性、情境性、可演化性和可信性。互联网软件操作系统代表了我们对未来基于互联网的应用的操作系统的看法。本文讨论了互联网软件操作系统的实例、技术挑战以及我们在这一领域的最新努力，并展望了互联网软件操作系统的未来。我们相信，在可预见的未来，互联网软件操作系统将变得无处不在，并能够为各种不同类型的计算机系统及其他领域构建。

# 笔记

> Mark Weiser envisioned a future of ubiquitous computing [6], where computing exists everywhere. To achieve true ubiquitous computing, every object and entity in the world may be programmable, for example, smart bulbs can sense the environment and change its colors accordingly. We have not reached the point where we need to build an OS for a smart bulb. However, we already need to build an OS for a robot, a smart home, or a network adaptor (i.e., SDN). As it seemed unrealistic when Mark Weiser proposed ubiquitous computing more than a quarter of a century ago, we argue that OSs will be ubiquitous too.

> M. Weiser, “The computer for the 21st century,” SIGMOBILE Mob. Comput. Commun. Rev., vol. 3, no. 3, pp. 3–11, Jul. 1999. [Online]. Available: http://doi.acm.org/10.1145/329124. 329126

微软的HomeOS：https://www.microsoft.com/en-us/research/project/homeos-enabling-smarter-homes-for-everyone/

YanOS, CampusOS, YanDaas