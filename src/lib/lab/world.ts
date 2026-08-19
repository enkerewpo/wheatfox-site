/**
 * ============================================================================
 *  仿真世界 —— 浏览器是机器人的身体
 * ============================================================================
 *
 *  只管「怎么画、怎么动」。不规划、不展开计划、不判前置条件 ——
 *  那些是服务器上 pilot 和 executor 的事。这里只暴露一组异步动作，
 *  动画播完才 resolve，executor 据此知道这一步做完了。
 *
 *  家具、地点、物体全部来自 scene-spec.ts，物体位置由家具顶面算出，
 *  所以不可能出现悬空 —— 之前的问题是台面高度在两处各写一遍、对不上。
 */

import * as THREE from 'three';
import {
  C, ROOM, FURNITURE, PLACES, OBJECTS, restingPosition, surfaceY, checkReachability,
  type PlaceId, type ObjectId,
} from './scene-spec';
import { buildGrid, planPath, resolveStand, isFree, type Grid } from './nav';
import { sfx } from './sfx';
import {
  solveArm, isArmSolution, armForward, poseFromSim, poseToSim, wrapAngle,
  ARM_MIN, ARM_MAX, SHOULDER_HEIGHT, SHOULDER_FORWARD,
  GRIPPER_OPEN, GRIPPER_CLOSED, JOINT_NAMES,
  type Pose, type Pose2,
} from './pose';
import type { WorldView } from './semantic-map';

/** 手臂收起来时的长度 */
const ARM_REST = 0.42;

export type { PlaceId, ObjectId };

export type LabEvents = {
  /** 说话气泡；null 表示收起 */
  onSay?: (text: string | null) => void;
  onDetect?: (obj: ObjectId) => void;
  /** 当前正在执行的动作，画在 3D 视图上；null 表示空闲 */
  onAction?: (label: string | null) => void;
};

/** 机器人自身放这一层，头部相机不渲染它 —— 否则拍到的全是自己的耳朵 */
const LAYER_SELF = 1;

export class LabWorld {
  readonly scene = new THREE.Scene();
  private renderer: THREE.WebGLRenderer;
  private viewCam: THREE.PerspectiveCamera;
  private robotCam: THREE.PerspectiveCamera;
  private camTarget: THREE.WebGLRenderTarget;

  private robot!: THREE.Group;
  private armPivot!: THREE.Object3D;
  private gripper!: THREE.Object3D;
  private armUpper!: THREE.Mesh;
  private armElbow!: THREE.Mesh;
  private armFore!: THREE.Mesh;
  private fingers: THREE.Mesh[] = [];
  private wheels: THREE.Mesh[] = [];
  private eyes: THREE.Mesh[] = [];
  private lid!: THREE.Mesh;

  /** 关节当前值 —— joint_command 读写的就是这张表 */
  private joints: Record<string, number> = {
    arm_shoulder_joint: -0.45,
    arm_extension_joint: ARM_REST,
    gripper_finger_joint: GRIPPER_OPEN,
  };
  /** 正在跑的导航 run —— navigate/status 查的是它 */
  private navRuns = new Map<string, { state: string; detail: string }>();
  private navSeq = 0;
  private navAbort: { cancelled: boolean } | null = null;

  private objects = new Map<ObjectId, THREE.Object3D>();
  /** 每个物体现在在哪；'held' 表示在夹爪里 */
  private placeOf = new Map<ObjectId, PlaceId | 'held'>();
  private held: ObjectId | null = null;
  private marker: THREE.Mesh | null = null;

  private clock = new THREE.Clock();
  private raf = 0;
  private tweens: ((dt: number) => boolean)[] = [];
  private events: LabEvents;

  /** 占用栅格：家具水平投影按机器人半径膨胀，导航靠它避障 */
  private grid: Grid = buildGrid();
  /** 朝向相机的两面墙，靠近时淡出，否则挡住屋里 */
  private cutaway: THREE.Mesh[] = [];

  constructor(canvas: HTMLCanvasElement, events: LabEvents = {}) {
    this.events = events;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.scene.background = null;

    /*
      取景要能装下整个房间 —— 房间 8×7，右侧还有冰箱和垃圾桶。
      之前机器人会被右边框裁掉。往右后方拉远、抬高，视野中心稍微偏右。
    */
    this.viewCam = new THREE.PerspectiveCamera(40, 4 / 3, 0.1, 80);
    this.viewCam.position.set(7.6, 6.6, 8.6);
    this.viewCam.lookAt(0.3, 0.5, -0.4);
    this.viewCam.layers.enable(LAYER_SELF);

    this.robotCam = new THREE.PerspectiveCamera(68, 4 / 3, 0.05, 40);
    this.robotCam.layers.set(0);
    this.camTarget = new THREE.WebGLRenderTarget(512, 384);

    /*
      开局先验一遍：每个地点的台面是不是真的够得着。
      不通过就抛 —— 这类几何错配不报错、只表现为「家务永远做不完」，
      与其让人对着一个永远失败的机器人猜，不如当场说清哪儿不对。
    */
    const issues = checkReachability(
      (pl) => resolveStand(this.grid, pl),
      SHOULDER_HEIGHT, SHOULDER_FORWARD, ARM_MIN, ARM_MAX,
    );
    if (issues.length) {
      throw new Error(
        'scene is unreachable at: ' +
        issues.map((i) => `${i.place} (needs ${i.needed} m at ${i.height} m high, ` +
                          `${i.distance} m away; arm spans ${ARM_MIN}-${ARM_MAX} m)`).join('; '),
      );
    }

    this.buildLights();
    this.buildRoom();
    this.buildFurniture();
    this.buildRobot();
    this.buildObjects();

    this.resize();
    this.loop();
  }

  /* ================================================================ 构建 */

  /**
   * 画一张木地板贴图（canvas 生成，不下载任何文件）。
   * 交错的长条木板 + 轻微色差 + 板缝，比纯色底有质感，
   * 也让机器人移动时有参照物。
   */
  private makeFloorTexture(): THREE.Texture {
    /*
      画一张木地板贴图（canvas 生成，不下载任何文件）。
      两个关键点，之前都没做对：
        · 板子要**细长**。真实地板一块约 12-18cm 宽、1m 多长；
          之前一块有半米宽，看着就是色块不是地板。
        · 色差要**克制**。同一批木料只有很小的色温差别，
          之前每块随机 26 阶，结果是花的。
    */
    const S = 1024;
    const cv = document.createElement('canvas');
    cv.width = cv.height = S;
    const g = cv.getContext('2d')!;

    const BASE = [206, 186, 158];      // 暖木色
    const ROWS = 14;                    // 行数越多，单块越细
    const rh = S / ROWS;
    const plank = S / 3.4;              // 板长

    g.fillStyle = `rgb(${BASE[0]},${BASE[1]},${BASE[2]})`;
    g.fillRect(0, 0, S, S);

    for (let r = 0; r < ROWS; r++) {
      // 每行错开三分之一，接缝才不会连成一条线
      const offset = ((r % 3) * plank) / 3;
      for (let x = -plank; x < S + plank; x += plank) {
        // 色差控制在 ±7 以内
        const d = Math.floor((Math.random() - 0.5) * 14);
        g.fillStyle = `rgb(${BASE[0] + d},${BASE[1] + d},${BASE[2] + d})`;
        g.fillRect(x + offset, r * rh, plank - 1, rh - 1);

        // 顺纹几道浅线
        g.strokeStyle = 'rgba(150,124,92,0.07)';
        g.lineWidth = 1;
        for (let k = 0; k < 2; k++) {
          const y = r * rh + 3 + Math.random() * (rh - 6);
          g.beginPath();
          g.moveTo(x + offset + 4, y);
          g.lineTo(x + offset + plank - 6, y + (Math.random() - 0.5) * 2);
          g.stroke();
        }
        // 板端接缝
        g.strokeStyle = 'rgba(132,106,76,0.20)';
        g.beginPath();
        g.moveTo(x + offset, r * rh);
        g.lineTo(x + offset, r * rh + rh);
        g.stroke();
      }
    }

    // 行缝
    g.strokeStyle = 'rgba(132,106,76,0.16)';
    g.lineWidth = 1.5;
    for (let r = 1; r < ROWS; r++) {
      g.beginPath(); g.moveTo(0, r * rh); g.lineTo(S, r * rh); g.stroke();
    }

    const tex = new THREE.CanvasTexture(cv);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    // 房间 8×7 米，重复 2 次 => 一块板约 14cm 宽、85cm 长，接近真实尺寸
    tex.repeat.set(2, 2);
    tex.anisotropy = 8;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  private mat(color: number, o: Partial<THREE.MeshStandardMaterialParameters> = {}) {
    return new THREE.MeshStandardMaterial({ color, roughness: 0.9, metalness: 0.02, ...o });
  }

  private buildLights() {
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0xcfc6b4, 2.0));
    const key = new THREE.DirectionalLight(0xfff6e6, 1.7);
    key.position.set(4, 8, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.normalBias = 0.02;
    const d = 7;
    key.shadow.camera.left = -d; key.shadow.camera.right = d;
    key.shadow.camera.top = d;   key.shadow.camera.bottom = -d;
    this.scene.add(key);
    const fill = new THREE.DirectionalLight(0xdfe6ef, 0.32);
    fill.position.set(-5, 4, 4);
    this.scene.add(fill);
  }

  private buildRoom() {
    const { w, d, wall } = ROOM;

    // 地板用程序化生成的木纹贴图 —— 纯色地板一眼假，而且看不出机器人在动
    const floorTex = this.makeFloorTexture();
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(w, d),
      new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.92, metalness: 0.0 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, 0.2);
    floor.receiveShadow = true;
    this.scene.add(floor);

    const rug = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.9), this.mat(C.rug));
    rug.rotation.x = -Math.PI / 2;
    rug.position.set(-1.6, 0.008, 2.2);
    rug.receiveShadow = true;
    this.scene.add(rug);

    /*
      四面墙 + 天花板都建齐 —— 房间必须是封闭的。
      朝向相机的那两面（前墙、右墙）和天花板做成「剖切」：
      材质半透明并且不写深度，玩家能看进屋里，但房间在物理上是完整的。
      这也是游戏里常用的做法，比直接不建墙诚实。
    */
    const solidWall = this.mat(C.wall, { side: THREE.DoubleSide });
    const cutWall = this.mat(C.wall, {
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.07,
      depthWrite: false,
    });

    const mkWall = (pw: number, px: number, pz: number, ry: number, cut = false) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(pw, wall), cut ? cutWall : solidWall);
      m.position.set(px, wall / 2, pz);
      m.rotation.y = ry;
      m.receiveShadow = !cut;
      this.scene.add(m);
      if (cut) this.cutaway.push(m);
      return m;
    };
    mkWall(w, 0, -3.3, 0);                       // 后墙（实）
    mkWall(d, -w / 2, 0.2, Math.PI / 2);         // 左墙（实）
    mkWall(d,  w / 2, 0.2, -Math.PI / 2, true);  // 右墙（剖切）
    mkWall(w, 0, 3.7, Math.PI, true);            // 前墙（剖切）

    // 天花板同样剖切，否则从上往下看整个屋子是黑的
    const ceil = new THREE.Mesh(
      new THREE.PlaneGeometry(w, d),
      this.mat(0xfbf7ef, { side: THREE.DoubleSide, transparent: true, opacity: 0.06, depthWrite: false }),
    );
    ceil.rotation.x = Math.PI / 2;
    ceil.position.set(0, wall, 0.2);
    this.scene.add(ceil);
    this.cutaway.push(ceil);

    // 窗户
    const win = new THREE.Mesh(
      new THREE.PlaneGeometry(1.5, 0.95),
      this.mat(0xcfe0ea, { emissive: 0xbcd4e2, emissiveIntensity: 0.4 }),
    );
    win.position.set(-1.0, 1.85, -3.27);
    this.scene.add(win);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.62, 1.07, 0.05), this.mat(C.woodDark));
    frame.position.set(-1.0, 1.85, -3.30);
    this.scene.add(frame);

    /*
      地面停靠点。画的是**导航解析之后**的实际可站位置，
      而不是 spec 里的理论值 —— 之前有几个圈落到了屋子外面，
      正是因为理论停靠点压在家具里、没被解析过。
    */
    for (const p of Object.values(PLACES)) {
      const [sx, sz] = resolveStand(this.grid, p.id);
      // 双保险：真跑到屋外就不画
      if (Math.abs(sx) > ROOM.w / 2 - 0.1 || Math.abs(sz - 0.2) > ROOM.d / 2 - 0.1) continue;
      const dot = new THREE.Mesh(
        new THREE.RingGeometry(0.18, 0.22, 24),
        new THREE.MeshBasicMaterial({ color: C.accent, transparent: true, opacity: 0.22 }),
      );
      dot.rotation.x = -Math.PI / 2;
      dot.position.set(sx, 0.012, sz);
      this.scene.add(dot);
    }
  }

  private buildFurniture() {
    for (const f of FURNITURE) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(...f.size), this.mat(f.color));
      m.position.set(...f.pos);
      m.castShadow = true;
      m.receiveShadow = true;
      this.scene.add(m);
    }

    for (const dx of [-0.17, 0.17]) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.022, 8, 22), this.mat(0x181614));
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(0.55 + dx, surfaceY('stove') + 0.004, -2.9);
      this.scene.add(ring);
    }
    const tap = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.3, 10), this.mat(C.metal));
    tap.position.set(-2.3, surfaceY('sink') + 0.15, -3.08);
    this.scene.add(tap);
    const seam = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.02, 0.02), this.mat(0xccd1d4));
    seam.position.set(2.35, 1.25, -2.48);
    this.scene.add(seam);
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.42, 0.04), this.mat(C.metal));
    handle.position.set(2.03, 1.55, -2.46);
    this.scene.add(handle);

    const lid = new THREE.Mesh(new THREE.BoxGeometry(0.37, 0.04, 0.37), this.mat(0x848a90));
    lid.position.set(3.0, 0.52, -1.1);
    lid.castShadow = true;
    this.scene.add(lid);
    this.lid = lid;
  }

  private buildObjectMesh(id: ObjectId): THREE.Object3D {
    const s = OBJECTS[id];
    const g = new THREE.Group();
    const [w, h, d] = s.size;
    let mesh: THREE.Mesh;

    switch (s.shape) {
      case 'sphere':
        mesh = new THREE.Mesh(new THREE.SphereGeometry(w / 2, 16, 12), this.mat(s.color));
        break;
      case 'ellipsoid':
        mesh = new THREE.Mesh(new THREE.SphereGeometry(w / 2, 16, 12), this.mat(s.color));
        mesh.scale.set(1, h / w, 1);
        break;
      case 'cylinder':
        mesh = new THREE.Mesh(new THREE.CylinderGeometry(w / 2, w / 2, h, 16), this.mat(s.color));
        break;
      case 'disc':
        mesh = new THREE.Mesh(new THREE.CylinderGeometry(w / 2, (w / 2) * 0.86, h, 22), this.mat(s.color));
        break;
      case 'bowl':
        mesh = new THREE.Mesh(
          new THREE.SphereGeometry(w / 2, 18, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
          this.mat(s.color, { side: THREE.DoubleSide }),
        );
        mesh.scale.set(1, h / (w / 2), 1);
        break;
      case 'box':
        mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), this.mat(s.color));
        break;
      case 'crumple':
        mesh = new THREE.Mesh(new THREE.DodecahedronGeometry(w / 2, 0), this.mat(s.color, { flatShading: true }));
        break;
      case 'plant': {
        const pot = new THREE.Mesh(
          new THREE.CylinderGeometry((w / 2) * 0.8, (w / 2) * 0.62, h * 0.4, 12), this.mat(C.pot));
        pot.position.y = -h * 0.3;
        pot.castShadow = true;
        g.add(pot);
        for (let i = 0; i < 5; i++) {
          const leaf = new THREE.Mesh(new THREE.SphereGeometry(w * 0.3, 10, 8), this.mat(s.color));
          leaf.scale.set(1, 0.5, 0.6);
          const a = (i / 5) * Math.PI * 2;
          leaf.position.set(Math.cos(a) * w * 0.24, h * 0.16 + (i % 2) * 0.05, Math.sin(a) * w * 0.24);
          leaf.rotation.z = Math.cos(a) * 0.5;
          leaf.castShadow = true;
          g.add(leaf);
        }
        g.userData.id = id;
        return g;
      }
    }
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    g.add(mesh);
    g.userData.id = id;
    return g;
  }

  private buildObjects() {
    for (const spec of Object.values(OBJECTS)) {
      const o = this.buildObjectMesh(spec.id);
      this.objects.set(spec.id, o);
      this.scene.add(o);
      this.moveObjectTo(spec.id, spec.start ?? spec.home);
    }
  }

  /** 摆到某地点的台面上 —— 位置由 scene-spec 从家具顶面算出，不会悬空 */
  private moveObjectTo(id: ObjectId, place: PlaceId) {
    const o = this.objects.get(id);
    if (!o) return;
    const slot = [...this.placeOf.entries()]
      .filter(([oid, p]) => oid !== id && p === place).length;
    o.position.set(...restingPosition(id, place, slot));
    o.rotation.set(0, 0, 0);
    this.placeOf.set(id, place);
  }

  private buildRobot() {
    /*
      造型目标：一眼看出是「移动机械臂」——
      底盘 + 大轮子在下、方正的躯干在中、带面罩的头在上、
      侧面挂一条分节明显的手臂。之前是个胶囊，看着像个团子。
    */
    const g = new THREE.Group();

    // ---- 底盘：扁平托盘 + 两个大轮 + 前脚轮 ----
    const deck = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.1, 0.44), this.mat(C.robotDark));
    deck.position.y = 0.14; deck.castShadow = true;
    g.add(deck);
    for (const dx of [-0.28, 0.28]) {
      const wm = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.08, 18), this.mat(0x141312));
      wm.rotation.z = Math.PI / 2;
      wm.position.set(dx, 0.14, 0);
      wm.castShadow = true;
      g.add(wm); this.wheels.push(wm);
      // 轮毂，转起来看得出来
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.09, 10), this.mat(C.metal));
      hub.rotation.z = Math.PI / 2;
      hub.position.set(dx, 0.14, 0);
      g.add(hub);
    }
    const caster = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), this.mat(0x141312));
    caster.position.set(0, 0.055, 0.19);
    g.add(caster);

    // ---- 躯干：方正带切角，比胶囊像机器 ----
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.5, 0.34), this.mat(C.robot));
    torso.position.y = 0.46; torso.castShadow = true;
    g.add(torso);
    // 胸前一块深色面板
    const panel = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.2, 0.02), this.mat(C.robotDark));
    panel.position.set(0, 0.5, 0.18);
    g.add(panel);
    const led = new THREE.Mesh(
      new THREE.TorusGeometry(0.045, 0.014, 8, 18),
      this.mat(C.accent, { emissive: C.accent, emissiveIntensity: 0.8 }),
    );
    led.position.set(0, 0.5, 0.195);
    g.add(led);

    // ---- 颈 + 头 ----
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.1, 10), this.mat(C.robotDark));
    neck.position.y = 0.75;
    g.add(neck);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.26, 0.28), this.mat(0xf7f2e6));
    head.position.y = 0.93; head.castShadow = true;
    g.add(head);
    // 面罩：一条深色横带，比两颗眼珠更像机器
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.02), this.mat(0x14120f));
    visor.position.set(0, 0.95, 0.145);
    g.add(visor);
    for (const dx of [-0.07, 0.07]) {
      const e = new THREE.Mesh(
        new THREE.CircleGeometry(0.032, 14),
        new THREE.MeshBasicMaterial({ color: C.accent }),
      );
      e.position.set(dx, 0.95, 0.157);
      g.add(e); this.eyes.push(e as unknown as THREE.Mesh);
    }
    // 头顶一根天线，剪影更好认
    const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.16, 6), this.mat(C.robotDark));
    ant.position.set(0.1, 1.13, 0);
    g.add(ant);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), this.mat(C.accent, { emissive: C.accent, emissiveIntensity: 0.5 }));
    tip.position.set(0.1, 1.22, 0);
    g.add(tip);

    // ---- 手臂：肩 → 上臂 → 前臂 → 夹爪，分节要看得出来 ----
    const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.065, 12, 10), this.mat(C.robotDark));
    shoulder.position.set(0.24, 0.62, 0.04);
    g.add(shoulder);

    const pivot = new THREE.Object3D();
    pivot.position.set(0.24, 0.62, 0.04);
    g.add(pivot);

    /*
      上臂和前臂都是伸缩段。一个纯转动的肩关节只能让末端在一个固定半径的
      圆弧上跑，够得到茶几就够不到料理台 —— 所以这条臂有两个自由度，
      URDF 里也是这么写的（arm_shoulder_joint + arm_extension_joint）。
      两边必须一致，否则 Soma 服务出去的身体和屏幕上这个对不上。
    */
    const upper = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.3, 0.075), this.mat(C.robot));
    upper.castShadow = true;
    pivot.add(upper);

    const elbow = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), this.mat(C.robotDark));
    pivot.add(elbow);

    const fore = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.24, 0.06), this.mat(C.metal));
    fore.castShadow = true;
    pivot.add(fore);

    const grip = new THREE.Object3D();
    pivot.add(grip);
    for (const dx of [-0.045, 0.045]) {
      const f = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.11, 0.05), this.mat(C.robotDark));
      f.position.set(dx, -0.05, 0);
      f.castShadow = true;
      grip.add(f);
      this.fingers.push(f);
    }
    this.armPivot = pivot;
    this.gripper = grip;
    this.armUpper = upper;
    this.armElbow = elbow;
    this.armFore = fore;
    pivot.rotation.x = -0.45;
    this.setArmExtension(ARM_REST);
    this.setGripperOpening(GRIPPER_OPEN);

    g.traverse((o) => o.layers.set(LAYER_SELF));

    /*
      头部相机装在面罩位置。
      three.js 的相机默认朝 -Z，而这台机器人的正面建在 +Z（眼睛、脚轮都在 +Z），
      所以必须转 180° —— 不然拍到的是身后，画面一片空。
    */
    this.robotCam.position.set(0, 0.95, 0.17);
    this.robotCam.rotation.y = Math.PI;
    this.robotCam.layers.set(0);
    g.add(this.robotCam);

    const [rx, rz] = resolveStand(this.grid, 'sofa');
    g.position.set(rx, 0, rz);
    this.robot = g;
    this.scene.add(g);
  }

  /* ============================================================ 动画基础 */

  private tween(ms: number, fn: (t: number) => void): Promise<void> {
    return new Promise((resolve) => {
      let el = 0;
      const dur = ms / 1000;
      this.tweens.push((dt) => {
        el += dt;
        const t = Math.min(1, el / dur);
        fn(t < 0.5 ? 4 * t ** 3 : 1 - Math.pow(-2 * t + 2, 3) / 2);
        if (t >= 1) { resolve(); return true; }
        return false;
      });
    });
  }

  private shortestAngle(from: number, to: number) {
    let d = (to - from) % (Math.PI * 2);
    if (d > Math.PI) d -= Math.PI * 2;
    if (d < -Math.PI) d += Math.PI * 2;
    return d;
  }

  private async turnTo(heading: number, ms = 220) {
    const a0 = this.robot.rotation.y;
    const da = this.shortestAngle(a0, heading);
    if (Math.abs(da) < 0.02) return;
    await this.tween(Math.max(ms, Math.abs(da) * 260), (t) => {
      this.robot.rotation.y = a0 + da * t;
    });
  }

  /* ============================================================ 能力动作 */

  /**
   * 开到某个地点。走廊在 z ≈ -1.4：先退到走廊、横移、再进位，
   * 免得斜穿餐桌和沙发。
   */
  async move(to: PlaceId): Promise<void> {
    this.events.onAction?.(`driving to ${PLACES[to].label}`);
    sfx.moveStart();
    /*
      走 A* 规划出来的无碰撞路径。
      之前是手写的「退到走廊再横移」，家具一动就穿模；现在障碍来自家具的
      实际几何，路径拉直后再逐段执行，走不通就如实失败而不是穿过去。
    */
    const from: [number, number] = [this.robot.position.x, this.robot.position.z];
    const target = resolveStand(this.grid, to);
    const path = planPath(this.grid, from, target);

    if (!path) {
      // 到不了就别假装到了 —— 让上层报失败
      throw new Error(`no collision-free path to ${to}`);
    }

    let cur = from;
    for (const wp of path.slice(1)) {
      const dist = Math.hypot(wp[0] - cur[0], wp[1] - cur[1]);
      if (dist < 0.03) { cur = wp; continue; }

      await this.turnTo(Math.atan2(wp[0] - cur[0], wp[1] - cur[1]));

      const sx = cur[0], sz = cur[1];
      await this.tween(Math.max(240, dist * 520), (t) => {
        this.robot.position.x = sx + (wp[0] - sx) * t;
        this.robot.position.z = sz + (wp[1] - sz) * t;
        for (const wm of this.wheels) wm.rotation.x -= dist * 0.09;
        this.robot.position.y = Math.abs(Math.sin(t * Math.PI * 7)) * 0.008;
      });
      this.robot.position.y = 0;
      cur = wp;
    }

    // 停稳后面向家具
    const p = PLACES[to];
    await this.turnTo(Math.atan2(p.spot[0] - cur[0], p.spot[1] - cur[1]), 180);
    sfx.moveStop();
    this.events.onAction?.(null);
  }

  /**
   * 语义地图查到某个物体时的可视化：眨眼 + 在物体下画个转动的圈。
   * 注意这**不是** camera primitive —— 标准契约里相机只负责取帧
   * （camera/snapshot），识别和定位属于 system/scene 服务。
   */
  async highlight(obj: ObjectId): Promise<boolean> {
    this.events.onAction?.(`locating ${OBJECTS[obj].label}`);
    sfx.detect();
    await this.tween(260, (t) => {
      const k = 1 - Math.sin(t * Math.PI) * 0.7;
      for (const e of this.eyes) e.scale.set(1, k, 1);
    });
    for (const e of this.eyes) e.scale.set(1, 1, 1);

    const o = this.objects.get(obj);
    if (!o) { this.events.onAction?.(null); return false; }

    if (this.marker) this.scene.remove(this.marker);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.13, 0.16, 20),
      new THREE.MeshBasicMaterial({ color: C.accent, side: THREE.DoubleSide }),
    );
    ring.rotation.x = -Math.PI / 2;
    const wp = new THREE.Vector3();
    o.getWorldPosition(wp);
    ring.position.set(wp.x, wp.y - OBJECTS[obj].rest + 0.005, wp.z);
    this.scene.add(ring);
    this.marker = ring;

    this.events.onDetect?.(obj);
    await this.tween(240, () => {});
    this.events.onAction?.(null);
    return true;
  }

  /**
   * robonix/primitive/arm/pos_command —— 末端移到某个物体上方。
   * 够不着（不在同一地点）就失败，不去假装。
   */
  async reachFor(obj: ObjectId): Promise<boolean> {
    if (this.placeOf.get(obj) !== this.nearestPlace()) return false;
    this.events.onAction?.(`reaching for ${OBJECTS[obj].label}`);
    await this.tween(400, (t) => { this.armPivot.rotation.x = -0.45 + t * 1.4; });
    this.events.onAction?.(null);
    return true;
  }

  /**
   * robonix/primitive/arm/joint_command，夹爪关节合拢 —— 抓住。
   * 前提是末端已经到位（reachFor 成功过）。
   */
  async closeGripper(obj: ObjectId): Promise<boolean> {
    const o = this.objects.get(obj);
    if (!o || this.held) return false;
    if (this.placeOf.get(obj) !== this.nearestPlace()) return false;

    this.events.onAction?.(`closing the gripper on ${OBJECTS[obj].label}`);
    sfx.grasp();
    this.gripper.add(o);
    o.position.set(0, -0.12, 0);
    // 拿在手里的东西自己要看得见，所以留在图层 0
    o.traverse((c) => c.layers.set(0));
    this.held = obj;
    this.placeOf.set(obj, 'held');
    if (this.marker) { this.scene.remove(this.marker); this.marker = null; }
    await this.tween(340, (t) => { this.armPivot.rotation.x = 0.95 - t * 1.0; });
    this.events.onAction?.(null);
    return true;
  }

  /**
   * 夹爪张开 —— 松手，物体落到机器人当前所在地点的台面上。
   * 返回放下的是什么，没拿东西返回 null。
   */
  async openGripper(): Promise<ObjectId | null> {
    if (!this.held) return null;
    const obj = this.held;
    const o = this.objects.get(obj)!;
    const target = this.nearestPlace();

    this.events.onAction?.(`releasing ${OBJECTS[obj].label} onto ${PLACES[target].label}`);
    sfx.release();
    await this.tween(360, (t) => { this.armPivot.rotation.x = -0.05 + t * 1.0; });
    this.scene.add(o);
    o.traverse((c) => c.layers.set(0));
    this.moveObjectTo(obj, target);
    this.held = null;

    if (target === 'bin') {
      await this.tween(280, (t) => { this.lid.rotation.z = -t * 0.85; this.lid.position.x = 3.0 - t * 0.13; });
      await this.tween(280, (t) => { this.lid.rotation.z = -0.85 + t * 0.85; this.lid.position.x = 2.87 + t * 0.13; });
    }
    await this.tween(320, (t) => { this.armPivot.rotation.x = 0.95 - t * 1.4; });
    this.events.onAction?.(null);
    return obj;
  }

  /** robonix/primitive/arm/end_pose */
  endPose() {
    const wp = new THREE.Vector3();
    this.gripper.getWorldPosition(wp);
    return {
      position: { x: +wp.x.toFixed(3), y: +wp.y.toFixed(3), z: +wp.z.toFixed(3) },
      holding: this.held,
    };
  }

  /** 说话：气泡由上层显示，这里只做点头 */
  async say(text: string, ms = 1500): Promise<void> {
    this.events.onAction?.('speaking');
    this.events.onSay?.(text);
    await this.tween(ms, (t) => {
      this.robot.rotation.z = Math.sin(t * Math.PI * 10) * 0.012;
    });
    this.robot.rotation.z = 0;
    this.events.onSay?.(null);
    this.events.onAction?.(null);
  }

  /** 灶台：冒热气 */
  async cook(_dish: string): Promise<void> {
    this.events.onAction?.('cooking');
    sfx.cook();
    const puffs: THREE.Mesh[] = [];
    const y0 = surfaceY('stove') + 0.12;
    for (let i = 0; i < 7; i++) {
      const p = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 10, 8),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 }),
      );
      p.position.set(0.55 + (Math.random() - 0.5) * 0.3, y0, -2.9 + (Math.random() - 0.5) * 0.2);
      this.scene.add(p); puffs.push(p);
    }
    await this.tween(2400, (t) => {
      puffs.forEach((p, i) => {
        p.position.y = y0 + t * (0.55 + i * 0.07);
        (p.material as THREE.MeshBasicMaterial).opacity = 0.5 * (1 - t);
        p.scale.setScalar(1 + t * 1.8);
      });
    });
    puffs.forEach((p) => this.scene.remove(p));
    this.events.onAction?.(null);
  }

  /** 洗：水花 */
  async wash(): Promise<void> {
    this.events.onAction?.('washing up');
    sfx.water();
    const y0 = surfaceY('sink') + 0.28;
    const drops: THREE.Mesh[] = [];
    for (let i = 0; i < 10; i++) {
      const dm = new THREE.Mesh(
        new THREE.SphereGeometry(0.02, 8, 6),
        new THREE.MeshBasicMaterial({ color: 0x9fd0e6, transparent: true, opacity: 0.85 }),
      );
      dm.position.set(-2.3 + (Math.random() - 0.5) * 0.2, y0, -2.95);
      this.scene.add(dm); drops.push(dm);
    }
    await this.tween(1900, (t) => {
      drops.forEach((dm, i) => {
        const ph = (t * 1.6 + i / drops.length) % 1;
        dm.position.y = y0 - ph * 0.26;
        (dm.material as THREE.MeshBasicMaterial).opacity = 0.85 * (1 - ph);
      });
    });
    drops.forEach((dm) => this.scene.remove(dm));
    this.events.onAction?.(null);
  }

  /** 浇水：水滴 + 叶子摇晃 */
  async water(): Promise<void> {
    const plant = this.objects.get('plant');
    if (!plant) return;
    this.events.onAction?.('watering the plant');
    sfx.water();
    const base = plant.position.clone();
    const drops: THREE.Mesh[] = [];
    for (let i = 0; i < 6; i++) {
      const dm = new THREE.Mesh(
        new THREE.SphereGeometry(0.017, 8, 6),
        new THREE.MeshBasicMaterial({ color: 0x8fc7e0, transparent: true, opacity: 0.9 }),
      );
      this.scene.add(dm); drops.push(dm);
    }
    await this.tween(1700, (t) => {
      drops.forEach((dm, i) => {
        const ph = (t * 1.5 + i / drops.length) % 1;
        dm.position.set(base.x + ((i % 3) - 1) * 0.05, base.y + 0.3 - ph * 0.3, base.z);
        (dm.material as THREE.MeshBasicMaterial).opacity = 0.9 * (1 - ph);
      });
      plant.rotation.z = Math.sin(t * Math.PI * 6) * 0.05;
    });
    plant.rotation.z = 0;
    drops.forEach((dm) => this.scene.remove(dm));
    this.events.onAction?.(null);
  }

  /* ==========================================================================
     米制层 —— primitive 契约真正调用的就是下面这些
     ==========================================================================

     上面那些 move(PlaceId) / reachFor(ObjectId) 是按地点名写的，方便本地
     离线兜底用。但 Robonix 的 primitive 契约里没有地点名这种东西：底盘只认
     「前进多少米、原地转多少度」，手臂只认笛卡尔位姿和关节名。名字住在
     system/scene 那一层，由 goal_near 翻译成米。

     这段就是那条分界线下面的部分。 */

  /** 底盘当前位姿 */
  basePose(): Pose2 {
    return { x: this.robot.position.x, y: this.robot.position.z, yaw: this.robot.rotation.y };
  }

  /** 伸缩段的视觉：上臂和前臂按比例拉长，夹爪跟到末端 */
  private setArmExtension(e: number) {
    const ext = Math.min(ARM_MAX, Math.max(ARM_MIN, e));
    const upperL = ext * 0.45;
    const foreL = ext * 0.5;
    this.armUpper.scale.y = upperL / 0.3;
    this.armUpper.position.y = -upperL / 2;
    this.armElbow.position.y = -upperL;
    this.armFore.scale.y = foreL / 0.24;
    this.armFore.position.y = -(upperL + foreL / 2);
    this.gripper.position.y = -ext;
    this.joints.arm_extension_joint = ext;
  }

  /** 夹爪张合：两根手指对开 */
  private setGripperOpening(m: number) {
    const o = Math.min(GRIPPER_OPEN, Math.max(GRIPPER_CLOSED, m));
    this.fingers.forEach((f, i) => { f.position.x = (i === 0 ? -1 : 1) * (0.012 + o * 0.73); });
    this.joints.gripper_finger_joint = o;
  }

  /**
   * robonix/primitive/chassis/move —— 有界运动，不含全局路径规划。
   *
   * 契约的原话就是「without global path planning」，所以这里**不绕障**：
   * 先转再直着走，撞上东西就在最后一个可站点停下并如实回报走了多远。
   * 想绕开家具是 service/navigation 的事。
   */
  async chassisMove(cmd: {
    forward_m?: number; rotate_deg?: number; duration_sec?: number;
  }): Promise<{ state: string; travelled_m: number; x: number; y: number; yaw: number; detail: string }> {
    const rot = cmd.rotate_deg ?? 0;
    const fwd = cmd.forward_m ?? 0;
    let detail = '';

    if (Math.abs(rot) > 0.01) {
      this.events.onAction?.(`turning ${rot > 0 ? 'left' : 'right'} ${Math.abs(rot).toFixed(0)}°`);
      await this.turnTo(wrapAngle(this.robot.rotation.y + (rot * Math.PI) / 180));
    }

    let travelled = 0;
    if (Math.abs(fwd) > 0.005) {
      this.events.onAction?.(`driving ${fwd.toFixed(2)} m`);
      sfx.moveStart();
      const x0 = this.robot.position.x, z0 = this.robot.position.z;
      const yaw = this.robot.rotation.y;
      const dirX = Math.sin(yaw), dirZ = Math.cos(yaw);

      // 先看能走多远 —— 沿途逐格试探，撞上就停
      let limit = Math.abs(fwd);
      const step = 0.05;
      for (let d = step; d <= Math.abs(fwd) + 1e-6; d += step) {
        const s = Math.sign(fwd) * d;
        if (!isFree(this.grid, x0 + dirX * s, z0 + dirZ * s)) {
          limit = Math.max(0, d - step);
          detail = `blocked after ${limit.toFixed(2)} m — something is in the way`;
          break;
        }
      }
      travelled = Math.sign(fwd) * limit;

      if (limit > 0.005) {
        const ms = cmd.duration_sec ? cmd.duration_sec * 1000 : Math.max(240, limit * 520);
        await this.tween(ms, (t) => {
          this.robot.position.x = x0 + dirX * travelled * t;
          this.robot.position.z = z0 + dirZ * travelled * t;
          for (const wm of this.wheels) wm.rotation.x -= limit * 0.09;
          this.robot.position.y = Math.abs(Math.sin(t * Math.PI * 7)) * 0.008;
        });
        this.robot.position.y = 0;
      }
      sfx.moveStop();
    }

    this.events.onAction?.(null);
    const p = this.basePose();
    return {
      state: detail ? 'blocked' : 'done',
      travelled_m: +travelled.toFixed(3),
      x: +p.x.toFixed(3), y: +p.y.toFixed(3), yaw: +p.yaw.toFixed(4),
      detail: detail || 'motion completed',
    };
  }

  /** robonix/primitive/chassis/stop */
  chassisStop(): { state: string; x: number; y: number; yaw: number } {
    this.tweens = [];                    // 丢掉在飞的运动补间
    if (this.navAbort) this.navAbort.cancelled = true;
    this.robot.position.y = 0;
    sfx.moveStop();
    this.events.onAction?.(null);
    const p = this.basePose();
    return { state: 'stopped', x: +p.x.toFixed(3), y: +p.y.toFixed(3), yaw: +p.yaw.toFixed(4) };
  }

  /**
   * robonix/service/navigation/navigate —— 带路径规划，走到给定位姿。
   * 阻塞到走完才 resolve，和参考实现（nav2 wrapper 等 action 结束）一致。
   */
  async navigate(goal: { x: number; y: number; yaw?: number }): Promise<{
    accepted: boolean; run_id: string; detail: string;
  }> {
    const runId = `run-${++this.navSeq}`;
    const from: [number, number] = [this.robot.position.x, this.robot.position.z];

    /*
      目标压在家具里就直接拒绝。

      规划器很容易把**物体自己的坐标**当成导航目标发过来 —— 杯子在茶几上，
      那个点当然是站不进去的。之前 planPath 会把它吸附到最近的空格然后报
      SUCCEEDED，机器人停在旁边、朝向随机，接着手臂报「偏了 44°」，
      而导航那一步显示的是绿色的成功。整条链路上最误导人的一步就在这儿。

      现在如实拒绝，并且把正确的做法直接写在错误里。
    */
    if (!isFree(this.grid, goal.x, goal.y)) {
      const detail =
        `(${goal.x.toFixed(2)}, ${goal.y.toFixed(2)}) is inside furniture or a wall — ` +
        'the chassis cannot stand there. If you are trying to reach an object, call ' +
        'robonix/system/scene/goal_near first and navigate to the pose it returns ' +
        '(including its yaw); an object\'s own coordinates are never a valid goal.';
      this.navRuns.set(runId, { state: 'FAILED', detail });
      return { accepted: false, run_id: runId, detail };
    }

    const path = planPath(this.grid, from, [goal.x, goal.y]);

    if (!path) {
      const detail = 'no collision-free path to that pose';
      this.navRuns.set(runId, { state: 'FAILED', detail });
      return { accepted: false, run_id: runId, detail };
    }

    this.navRuns.set(runId, { state: 'RUNNING', detail: `${path.length} waypoints` });
    const abort = { cancelled: false };
    this.navAbort = abort;

    this.events.onAction?.('navigating');
    sfx.moveStart();
    let cur = from;
    let metres = 0;
    for (const wp of path.slice(1)) {
      if (abort.cancelled) break;
      const dist = Math.hypot(wp[0] - cur[0], wp[1] - cur[1]);
      if (dist < 0.03) { cur = wp; continue; }
      await this.turnTo(Math.atan2(wp[0] - cur[0], wp[1] - cur[1]));
      if (abort.cancelled) break;
      const sx = cur[0], sz = cur[1];
      await this.tween(Math.max(240, dist * 520), (t) => {
        this.robot.position.x = sx + (wp[0] - sx) * t;
        this.robot.position.z = sz + (wp[1] - sz) * t;
        for (const wm of this.wheels) wm.rotation.x -= dist * 0.09;
        this.robot.position.y = Math.abs(Math.sin(t * Math.PI * 7)) * 0.008;
      });
      this.robot.position.y = 0;
      cur = wp;
      metres += dist;
    }
    sfx.moveStop();
    this.events.onAction?.(null);
    this.navAbort = null;

    if (abort.cancelled) {
      const detail = `cancelled after ${metres.toFixed(2)} m`;
      this.navRuns.set(runId, { state: 'CANCELED', detail });
      return { accepted: true, run_id: runId, detail };
    }

    /*
      收尾朝向。goal_near 给出的位姿里带着「站这儿、面向这件家具」的 yaw，
      规划器会把它填进目标四元数，所以正常路径下这里就是转到位。

      没给朝向（退化四元数）时按行进方向停下 —— 那是导航的通用做法，
      也如实反映了「你没告诉我要朝哪边」。
    */
    if (goal.yaw !== undefined) await this.turnTo(goal.yaw, 180);

    const detail = `drove ${metres.toFixed(2)} m along ${path.length} waypoints`;
    this.navRuns.set(runId, { state: 'SUCCEEDED', detail });
    return { accepted: true, run_id: runId, detail };
  }

  navStatus(runId: string): { known: boolean; state: string; detail: string } {
    const r = this.navRuns.get(runId);
    return r ? { known: true, ...r } : { known: false, state: 'UNKNOWN', detail: 'no such run' };
  }

  navCancel(runId: string): { accepted: boolean; detail: string } {
    const r = this.navRuns.get(runId);
    if (!r) return { accepted: false, detail: 'no such run' };
    if (r.state !== 'RUNNING') return { accepted: false, detail: `run is already ${r.state}` };
    if (this.navAbort) this.navAbort.cancelled = true;
    return { accepted: true, detail: 'cancelling' };
  }

  /**
   * robonix/primitive/arm/pos_command —— 末端到一个笛卡尔位姿。
   * IK 由 provider 负责，契约里明说了。够不着就抛，不去半途而废。
   */
  async armTo(target: Pose): Promise<{ reached: { x: number; y: number; z: number } }> {
    const sol = solveArm(this.basePose(), target);
    if (!isArmSolution(sol)) {
      // 说清楚是哪一维不行、该怎么补救 —— 这条话会一路走到 VLM 面前
      throw new Error(`cannot reach that pose: ${sol.detail}`);
    }
    this.events.onAction?.('moving the arm');
    const p0 = this.joints.arm_shoulder_joint;
    const e0 = this.joints.arm_extension_joint;
    await this.tween(420, (t) => {
      this.armPivot.rotation.x = p0 + (sol.pitch - p0) * t;
      this.setArmExtension(e0 + (sol.extension - e0) * t);
    });
    this.joints.arm_shoulder_joint = sol.pitch;
    this.armPivot.rotation.x = sol.pitch;
    this.events.onAction?.(null);
    const reached = poseToSim(armForward(this.basePose(), sol));
    return { reached: { x: +reached.x.toFixed(3), y: +reached.z.toFixed(3), z: +reached.height.toFixed(3) } };
  }

  /**
   * robonix/primitive/arm/joint_command —— 按名字给关节下位置。
   * 夹爪就是其中一个具名关节，契约注释里就是这么规定的：合拢=抓住。
   */
  async jointCommand(names: string[], positions: number[]): Promise<{
    name: string[]; position: number[]; grasped?: string | null; released?: string | null;
  }> {
    let grasped: string | null = null;
    let released: string | null = null;

    for (let i = 0; i < names.length; i++) {
      const n = names[i];
      const v = positions[i];
      if (!(JOINT_NAMES as readonly string[]).includes(n)) {
        throw new Error(`unknown joint "${n}". This arm has: ${JOINT_NAMES.join(', ')}`);
      }
      if (!Number.isFinite(v)) throw new Error(`joint "${n}" needs a numeric position`);

      if (n === 'arm_shoulder_joint') {
        this.events.onAction?.('moving the arm');
        const a0 = this.armPivot.rotation.x;
        await this.tween(320, (t) => { this.armPivot.rotation.x = a0 + (v - a0) * t; });
        this.joints.arm_shoulder_joint = v;
        this.events.onAction?.(null);
      } else if (n === 'arm_extension_joint') {
        const e0 = this.joints.arm_extension_joint;
        await this.tween(320, (t) => this.setArmExtension(e0 + (v - e0) * t));
      } else {
        // 夹爪
        if (v <= 0.02) grasped = await this.closeGripperMetric();
        else released = await this.openGripperMetric(v);
      }
    }
    return {
      name: [...JOINT_NAMES],
      position: JOINT_NAMES.map((n) => +this.joints[n].toFixed(4)),
      grasped, released,
    };
  }

  /** 合拢：抓住末端附近的东西。附近没东西就失败 —— 不凭空变一个出来 */
  private async closeGripperMetric(): Promise<string> {
    if (this.held) throw new Error(`the gripper already holds ${this.held}`);
    const gp = new THREE.Vector3();
    this.gripper.getWorldPosition(gp);

    let best: ObjectId | null = null;
    let bd = 0.26;                       // 夹爪的有效抓取半径
    for (const [id, mesh] of this.objects) {
      if (this.placeOf.get(id) === 'held') continue;
      const wp = new THREE.Vector3();
      mesh.getWorldPosition(wp);
      const d = wp.distanceTo(gp);
      if (d < bd) { bd = d; best = id; }
    }
    if (!best) {
      throw new Error(
        'the gripper closed on nothing — no object within 0.26 m of the end effector. ' +
        'Send arm/pos_command to the object pose first.',
      );
    }

    this.events.onAction?.(`grasping ${OBJECTS[best].label}`);
    sfx.grasp();
    await this.tween(240, (t) => this.setGripperOpening(GRIPPER_OPEN * (1 - t)));
    const o = this.objects.get(best)!;
    this.gripper.add(o);
    o.position.set(0, -0.12, 0);
    o.traverse((c) => c.layers.set(0));   // 拿在手里的东西自己要看得见
    this.held = best;
    this.placeOf.set(best, 'held');
    if (this.marker) { this.scene.remove(this.marker); this.marker = null; }
    this.events.onAction?.(null);
    return best;
  }

  /** 张开：松手，东西落到脚下最近的台面上 */
  private async openGripperMetric(opening: number): Promise<string | null> {
    this.events.onAction?.('opening the gripper');
    await this.tween(240, (t) => this.setGripperOpening(GRIPPER_OPEN * t));
    this.setGripperOpening(opening);
    if (!this.held) { this.events.onAction?.(null); return null; }

    const obj = this.held;
    const o = this.objects.get(obj)!;
    const target = this.nearestPlace();
    sfx.release();
    this.scene.add(o);
    o.traverse((c) => c.layers.set(0));
    this.moveObjectTo(obj, target);
    this.held = null;

    if (target === 'bin') {
      await this.tween(280, (t) => { this.lid.rotation.z = -t * 0.85; this.lid.position.x = 3.0 - t * 0.13; });
      await this.tween(280, (t) => { this.lid.rotation.z = -0.85 + t * 0.85; this.lid.position.x = 2.87 + t * 0.13; });
    }
    this.events.onAction?.(null);
    return obj;
  }

  /** robonix/primitive/arm/end_pose */
  endPoseMetric(): Pose {
    const wp = new THREE.Vector3();
    this.gripper.getWorldPosition(wp);
    return poseFromSim(wp.x, wp.z, wp.y, this.robot.rotation.y);
  }

  /** 给 semantic-map 用的世界视图 */
  worldView(): WorldView {
    const placeOf: Record<string, PlaceId | 'held'> = {};
    const objectPos: Record<string, [number, number, number]> = {};
    for (const [id, p] of this.placeOf) placeOf[id] = p;
    for (const [id, mesh] of this.objects) {
      const wp = new THREE.Vector3();
      mesh.getWorldPosition(wp);
      objectPos[id] = [+wp.x.toFixed(3), +wp.y.toFixed(3), +wp.z.toFixed(3)];
    }
    return {
      placeOf, objectPos,
      robot: {
        x: +this.robot.position.x.toFixed(3),
        z: +this.robot.position.z.toFixed(3),
        yaw: +this.robot.rotation.y.toFixed(4),
      },
      holding: this.held,
    };
  }

  /** 停靠点解算 —— goal_near 要用，可站性判断在导航侧 */
  standFor(place: PlaceId): [number, number] {
    return resolveStand(this.grid, place);
  }

  /* ====================================================== 相机 / 状态 */

  /** 渲染一帧机器人视角，返回 JPEG data URL —— 这帧会真的发给 VLM */
  captureRobotView(quality = 0.7): string {
    const prev = this.renderer.getRenderTarget();
    this.renderer.setRenderTarget(this.camTarget);
    // 场景背景是透明的，转成 JPEG 后空处会变纯黑；先铺一层底色
    this.renderer.setClearColor(0xe9e3d6, 1);
    this.renderer.clear();
    this.renderer.render(this.scene, this.robotCam);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setRenderTarget(prev);

    const { width: w, height: h } = this.camTarget;
    const buf = new Uint8Array(w * h * 4);
    this.renderer.readRenderTargetPixels(this.camTarget, 0, 0, w, h, buf);

    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d')!;
    const img = ctx.createImageData(w, h);
    // WebGL 原点在左下，画布在左上，要上下翻转
    for (let y = 0; y < h; y++) {
      const src = (h - 1 - y) * w * 4;
      img.data.set(buf.subarray(src, src + w * 4), y * w * 4);
    }
    ctx.putImageData(img, 0, 0);
    return cv.toDataURL('image/jpeg', quality);
  }

  nearestPlace(): PlaceId {
    let best: PlaceId = 'sofa';
    let bd = Infinity;
    for (const p of Object.values(PLACES)) {
      const d = Math.hypot(this.robot.position.x - p.stand[0], this.robot.position.z - p.stand[1]);
      if (d < bd) { bd = d; best = p.id; }
    }
    return best;
  }

  /** 世界快照，给 scene 服务用 */
  snapshot(): { at: PlaceId; holding: ObjectId | null; where: Record<string, string> } {
    const where: Record<string, string> = {};
    for (const [id, p] of this.placeOf) where[id] = p;
    return { at: this.nearestPlace(), holding: this.held, where };
  }

  /* ================================================================ 循环 */

  private loop = () => {
    this.raf = requestAnimationFrame(this.loop);
    const dt = Math.min(this.clock.getDelta(), 0.05);
    this.tweens = this.tweens.filter((fn) => !fn(dt));
    if (this.marker) this.marker.rotation.z = this.clock.elapsedTime * 1.6;
    this.renderer.render(this.scene, this.viewCam);
  };

  resize() {
    const c = this.renderer.domElement;
    const w = c.clientWidth || 640;
    const h = c.clientHeight || 480;
    this.renderer.setSize(w, h, false);
    this.viewCam.aspect = w / h;
    this.viewCam.updateProjectionMatrix();
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    this.renderer.dispose();
    this.camTarget.dispose();
  }
}
