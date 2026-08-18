/**
 * ============================================================================
 *  位姿 —— 米、弧度、四元数
 * ============================================================================
 *
 *  Robonix 的标准契约全部是**米制位姿**，不是地点名：
 *
 *    chassis/move        MoveCommand{ forward_m, rotate_deg, linear_*, angular_* }
 *                        ——「有界运动，不含全局路径规划」
 *    arm/pos_command     geometry_msgs/Pose ——  6 自由度，位置 + 四元数
 *    arm/joint_command   sensor_msgs/JointState —— names[] / positions[]
 *
 *  「去餐桌」「抓杯子」这类语义不属于这一层：地点名和物体名住在 system/scene
 *  的语义地图里，由 navigation 服务把语义目标翻译成位姿，再拆成底盘能执行的
 *  前进/转向增量。
 *
 *  这个文件就是那条分界线：上面是语义，下面全是数。
 */

/** 平面位姿：位置 (m) + 朝向 (rad)。仿真是 2.5D，用 yaw 就够 */
export type Pose2 = { x: number; y: number; yaw: number };

/** geometry_msgs/Pose 的线上形状 */
export type Pose = {
  position: { x: number; y: number; z: number };
  orientation: { x: number; y: number; z: number; w: number };
};

/** sensor_msgs/JointState 的线上形状 */
export type JointState = {
  name: string[];
  position: number[];
  velocity?: number[];
  effort?: number[];
};

/** chassis 的 MoveCommand */
export type MoveCommand = {
  linear_x: number;
  linear_y: number;
  linear_z: number;
  angular_x: number;
  angular_y: number;
  angular_z: number;
  duration_sec: number;
  /** 前进多少米（负数后退） */
  forward_m: number;
  /** 原地转多少度（正为左转） */
  rotate_deg: number;
};

/* -------------------------------------------------------------------------- */
/* 转换                                                                        */
/* -------------------------------------------------------------------------- */

/** 绕 Z 轴的 yaw → 四元数 */
export function yawToQuat(yaw: number) {
  const h = yaw / 2;
  return { x: 0, y: 0, z: Math.sin(h), w: Math.cos(h) };
}

/** 四元数 → yaw（只取绕 Z 的分量） */
export function quatToYaw(q: Pose['orientation']): number {
  return Math.atan2(2 * (q.w * q.z + q.x * q.y), 1 - 2 * (q.y * q.y + q.z * q.z));
}

/**
 * 三维位姿 ↔ 平面位姿。
 * 仿真里 three.js 用 (x, y=高度, z)，而 ROS 约定 (x, y, z=高度)，
 * 所以平面坐标要换轴：three 的 z 是 ROS 的 y。转换只在这里发生。
 */
export function poseFromSim(x: number, z: number, height: number, yaw: number): Pose {
  return {
    position: { x, y: z, z: height },
    orientation: yawToQuat(yaw),
  };
}

export function poseToSim(p: Pose): { x: number; z: number; height: number; yaw: number } {
  return { x: p.position.x, z: p.position.y, height: p.position.z, yaw: quatToYaw(p.orientation) };
}

/** 归一化到 (-π, π] */
export function wrapAngle(a: number): number {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a <= -Math.PI) a += Math.PI * 2;
  return a;
}

/**
 * 把一条平面折线拆成底盘能执行的 MoveCommand 序列。
 *
 * 这是 navigation 服务的核心工作：规划出路径之后，底盘只会
 * 「转多少度、走多少米」，所以每一段都要拆成一转一走。
 */
export function pathToMoveCommands(
  from: Pose2, waypoints: [number, number][],
): MoveCommand[] {
  const cmds: MoveCommand[] = [];
  let cur = { ...from };

  const blank = (): MoveCommand => ({
    linear_x: 0, linear_y: 0, linear_z: 0,
    angular_x: 0, angular_y: 0, angular_z: 0,
    duration_sec: 0, forward_m: 0, rotate_deg: 0,
  });

  for (const [wx, wy] of waypoints) {
    const dx = wx - cur.x;
    const dy = wy - cur.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 0.02) continue;

    const heading = Math.atan2(dx, dy);      // 仿真里 +z 为前，和 three.js 一致
    const turn = wrapAngle(heading - cur.yaw);
    if (Math.abs(turn) > 0.02) {
      const c = blank();
      c.rotate_deg = (turn * 180) / Math.PI;
      c.duration_sec = Math.max(0.15, Math.abs(turn) * 0.35);
      cmds.push(c);
      cur.yaw = heading;
    }

    const c = blank();
    c.forward_m = dist;
    c.duration_sec = Math.max(0.25, dist * 0.55);
    cmds.push(c);
    cur.x = wx;
    cur.y = wy;
  }
  return cmds;
}

/** 转到某个绝对朝向所需的单条指令 */
export function faceCommand(from: Pose2, targetX: number, targetY: number): MoveCommand | null {
  const heading = Math.atan2(targetX - from.x, targetY - from.y);
  const turn = wrapAngle(heading - from.yaw);
  if (Math.abs(turn) < 0.03) return null;
  return {
    linear_x: 0, linear_y: 0, linear_z: 0,
    angular_x: 0, angular_y: 0, angular_z: 0,
    duration_sec: Math.max(0.15, Math.abs(turn) * 0.35),
    forward_m: 0,
    rotate_deg: (turn * 180) / Math.PI,
  };
}

/* -------------------------------------------------------------------------- */
/* 机械臂                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * 这台机器人暴露的关节 —— joint_command 用的就是这些名字。
 *
 * 一开始只有肩关节，但一个转动自由度画不出一条能同时够到 0.42 m 的茶几
 * 和 1.62 m 的顶层架子的臂：末端只能在一个固定半径的圆弧上跑。所以加了
 * 一个伸缩关节。URDF 里也是这么写的，两边必须一致，否则 Soma 服务出去的
 * 身体和屏幕上那个就是两台不同的机器人。
 */
export const JOINT_NAMES = [
  'arm_shoulder_joint',
  'arm_extension_joint',
  'gripper_finger_joint',
] as const;
export type JointName = (typeof JOINT_NAMES)[number];

/** 夹爪张合范围（米） */
export const GRIPPER_OPEN = 0.045;
export const GRIPPER_CLOSED = 0.0;

/** 肩关节离地高度（米），和 world.ts 里的枢轴一致 */
export const SHOULDER_HEIGHT = 0.62;
/** 肩关节在底盘前方的偏移（米） */
export const SHOULDER_FORWARD = 0.04;
/**
 * 伸缩关节的行程。
 *
 * 这两个数不是随手定的：机器人停在离家具外沿 0.62 m 处（CLEARANCE），
 * 物体又摆在靠近它那一侧，所以典型的水平够取距离在 0.7～0.8 m。
 * 上限留到 0.88 才够得着餐桌深处；TIAGo 那类真机的臂展也在这个量级。
 * 改动这里就要跟着改 browser_sim.urdf，否则 Soma 服务出去的身体
 * 和屏幕上那个就是两台不同的机器人。
 */
export const ARM_MIN = 0.35;
export const ARM_MAX = 0.88;

export type ArmSolution = {
  /** 肩关节俯仰（弧度）。0 = 竖直向下，负值向前抬 */
  pitch: number;
  /** 肩到末端的距离（米） */
  extension: number;
};

/**
 * 两自由度 IK。契约里明确说了 Cartesian 目标由 provider 自己解，
 * 这就是那个解算器。
 *
 * 末端在机器人本体的矢状面里运动：绕肩关节俯仰，再沿臂伸缩。所以先把
 * 世界坐标的目标换到机器人坐标，取「正前方距离」和「相对肩的落差」，
 * 剩下就是一个极坐标转换。
 *
 * 够不着就返回 null —— 让上层如实报「out of reach」，
 * 而不是把手伸到墙里去假装成功。
 */
export type ArmFailure = {
  /** 出问题的是哪一维 —— 上层据此给出可执行的建议 */
  reason: 'off_axis' | 'behind' | 'too_far' | 'too_close';
  /** 一句能直接讲给规划器听的话 */
  detail: string;
};

export function solveArm(base: Pose2, target: Pose): ArmSolution | ArmFailure {
  const t = poseToSim(target);

  /*
    目标相对底盘中心的位移，转到机器人自身坐标系。

    这里的 yaw 约定和仿真一致：机器人的正前方是 (sin yaw, cos yaw)，
    也就是 three.js 的 +z 方向。所以前向分量就是位移在这个方向上的投影。

    这一段曾经写成 sin(-yaw)/cos(-yaw)，把正前方算成了正后方 —— 表现是
    机器人明明已经正对着物体，手臂却报「偏了 156°」。armForward 用的是
    +yaw，两个函数互相矛盾，谁也没发现。写在这里提醒：这两处的约定
    必须一起改。
  */
  const dx = t.x - base.x;
  const dz = t.z - base.y;
  const sy = Math.sin(base.yaw);
  const cy = Math.cos(base.yaw);
  const forward = dx * sy + dz * cy;
  const lateral = dx * cy - dz * sy;

  const bearingDeg = (Math.atan2(lateral, forward) * 180) / Math.PI;
  const dist = Math.hypot(forward, lateral);

  /*
    这条臂装在矢状面上，只能往正前方够。所以「够不着」有四种完全不同的原因，
    分别对应完全不同的补救动作 —— 笼统报一句 "out of reach" 等于什么都没说，
    规划器只能瞎猜。之前就吃过这个亏：明明只是车没转正，错误里却报了一个
    落在合法区间内的距离，看上去像 bug。
  */
  if (Math.abs(lateral) > 0.26) {
    /*
      转向的符号必须和 chassis/move 一致，否则规划器会被带进死循环。

      推导：机器人正前方是 (sin yaw, cos yaw)，chassisMove 做的是
      `rotation.y += rotate_deg`，所以**增大** yaw 会把正前方从 +z 转向 +x。
      而 lateral = dx·cos yaw − dz·sin yaw，在 yaw=0 时就是 dx —— 目标在 +x
      侧则 lateral > 0。两者合起来：bearing 为正就该发正的 rotate_deg。

      这里曾经写成 -bearingDeg。模型每次都严格照做，于是每转一次就往反方向
      多偏同样的角度，误差 18° → 36° → 72° → 144° 精确翻倍，一路转到放弃。
      那不是模型笨，是我给的指令自相矛盾。改这里就要重新验一遍 chassisMove。

      左右也跟着定：+x 是机器人的左手边（three.js 里 +y 朝上、面向 +z 时，
      right = forward × up = -x），所以 bearing 为正是「偏左」。
    */
    return {
      reason: 'off_axis',
      detail: `the target is ${Math.abs(bearingDeg).toFixed(0)}° off to the `
        + `${bearingDeg > 0 ? 'left' : 'right'} of the arm, which only reaches straight ahead. `
        + `Send chassis/move with rotate_deg=${bearingDeg.toFixed(0)} to face it, then try again.`,
    };
  }

  const reachForward = forward - SHOULDER_FORWARD;
  const drop = SHOULDER_HEIGHT - t.height;

  if (reachForward < -0.05) {
    return {
      reason: 'behind',
      detail: `the target is ${(-forward).toFixed(2)} m behind the robot. `
        + 'Turn around with chassis/move before reaching.',
    };
  }

  const extension = Math.hypot(reachForward, drop);
  if (extension > ARM_MAX) {
    return {
      reason: 'too_far',
      detail: `the target needs ${extension.toFixed(2)} m of reach but the arm stops at `
        + `${ARM_MAX} m. Drive ${(extension - ARM_MAX + 0.06).toFixed(2)} m closer with `
        + 'chassis/move (forward_m), then try again.',
    };
  }
  if (extension < ARM_MIN) {
    return {
      reason: 'too_close',
      detail: `the target is only ${extension.toFixed(2)} m away and the arm cannot fold in `
        + `tighter than ${ARM_MIN} m. Back off ${(ARM_MIN - extension + 0.06).toFixed(2)} m `
        + 'with chassis/move (negative forward_m).',
    };
  }

  // pitch: 0 = 竖直向下 (drop = extension)，负值把末端往前抬起来
  const pitch = -Math.atan2(reachForward, drop);
  return { pitch, extension };
}

/** 判别 solveArm 的返回 */
export function isArmSolution(r: ArmSolution | ArmFailure): r is ArmSolution {
  return (r as ArmSolution).extension !== undefined;
}

/** IK 的逆运算 —— 给定关节量，末端在世界坐标的哪里 */
export function armForward(base: Pose2, sol: ArmSolution): Pose {
  const reachForward = SHOULDER_FORWARD + Math.sin(-sol.pitch) * sol.extension;
  const height = SHOULDER_HEIGHT - Math.cos(sol.pitch) * sol.extension;
  const x = base.x + reachForward * Math.sin(base.yaw);
  const z = base.y + reachForward * Math.cos(base.yaw);
  return poseFromSim(x, z, height, base.yaw);
}
