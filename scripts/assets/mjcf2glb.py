#!/usr/bin/env python3
"""MJCF (MuJoCo Menagerie) -> GLB, preserving the body/joint hierarchy so the
result stays articulable in three.js. Bakes <material rgba> into glTF materials."""
import sys, os, xml.etree.ElementTree as ET
import numpy as np, trimesh, fast_simplification

xml_path, out_glb = sys.argv[1], sys.argv[2]
keep = float(sys.argv[3]) if len(sys.argv) > 3 else 1.0
base = os.path.dirname(os.path.abspath(xml_path))
root = ET.parse(xml_path).getroot()

comp = root.find("compiler")
meshdir = comp.get("meshdir", "") if comp is not None else ""


def quat_to_R(q):  # MuJoCo order: w x y z (not normalized in files)
    w, x, y, z = q
    n = np.sqrt(w * w + x * x + y * y + z * z)
    if n == 0:
        return np.eye(3)
    w, x, y, z = w / n, x / n, y / n, z / n
    return np.array([
        [1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
        [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
        [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)],
    ])


def elem_T(e):
    T = np.eye(4)
    T[:3, 3] = [float(v) for v in e.get("pos", "0 0 0").split()]
    if e.get("quat"):
        T[:3, :3] = quat_to_R([float(v) for v in e.get("quat").split()])
    elif e.get("euler"):
        a, b, c = [float(v) for v in e.get("euler").split()]
        T[:3, :3] = trimesh.transformations.euler_matrix(a, b, c)[:3, :3]
    return T


# ---- assets ----
materials = {}
for m in root.iter("material"):
    if m.get("rgba"):
        materials[m.get("name")] = [float(v) for v in m.get("rgba").split()]

meshes = {}
for m in root.iter("mesh"):
    f = m.get("file")
    if not f:
        continue
    name = m.get("name") or os.path.splitext(os.path.basename(f))[0]
    meshes[name] = (os.path.join(base, meshdir, f),
                    [float(v) for v in m.get("scale", "1 1 1").split()])

cache, stats = {}, {"orig": 0, "new": 0}


def get_mesh(name):
    path, scale = meshes[name]
    key = (name,)
    if key in cache:
        return cache[key].copy()
    m = trimesh.load(path, force="mesh")
    stats["orig"] += len(m.faces)
    if keep < 1.0 and len(m.faces) > 200:
        v, f = fast_simplification.simplify(
            np.asarray(m.vertices, np.float32), np.asarray(m.faces, np.int32), 1.0 - keep)
        m = trimesh.Trimesh(vertices=v, faces=f, process=False)
    if scale != [1, 1, 1]:
        m.apply_scale(scale)
        if np.prod(scale) < 0:
            m.invert()
    cache[key] = m
    return m.copy()


scene = trimesh.Scene()
njoints = [0]


def walk(body, parent_frame):
    name = body.get("name") or f"body{id(body)}"
    scene.graph.update(frame_to=name, frame_from=parent_frame, matrix=elem_T(body))
    njoints[0] += len(body.findall("joint"))
    for i, g in enumerate(body.findall("geom")):
        mn = g.get("mesh")
        if mn and mn in meshes:
            m = get_mesh(mn)
        elif g.get("type") == "box" and g.get("size"):
            m = trimesh.creation.box(extents=2 * np.array([float(v) for v in g.get("size").split()]))
        else:
            continue
        rgba = materials.get(g.get("material"), [0.75, 0.75, 0.75, 1.0])
        m.visual = trimesh.visual.TextureVisuals(
            material=trimesh.visual.material.PBRMaterial(
                baseColorFactor=[int(255 * c) for c in rgba],
                metallicFactor=0.1, roughnessFactor=0.6,
                name=g.get("material") or "default"))
        m.apply_transform(elem_T(g))
        stats["new"] += len(m.faces)
        scene.add_geometry(m, node_name=f"{name}_geom{i}", parent_node_name=name)
    for child in body.findall("body"):
        walk(child, name)


for b in root.find("worldbody").findall("body"):
    walk(b, "world")

scene.export(out_glb)
print(f"  bodies-joints={njoints[0]}  tris {stats['orig']} -> {stats['new']}  "
      f"{out_glb}: {os.path.getsize(out_glb)/1e6:.2f} MB")
