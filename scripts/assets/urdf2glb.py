#!/usr/bin/env python3
"""Minimal URDF -> GLB converter used to measure realistic web payload sizes.
Preserves the link hierarchy so joints remain animatable in three.js."""
import sys, os, math, xml.etree.ElementTree as ET
import numpy as np, trimesh
import fast_simplification

urdf_path, mesh_dir, out_glb = sys.argv[1], sys.argv[2], sys.argv[3]
ratio = float(sys.argv[4]) if len(sys.argv) > 4 else 1.0  # keep-fraction of triangles

root = ET.parse(urdf_path).getroot()


def rpy_xyz_to_matrix(origin):
    T = np.eye(4)
    if origin is None:
        return T
    xyz = [float(v) for v in origin.get("xyz", "0 0 0").split()]
    r, p, y = [float(v) for v in origin.get("rpy", "0 0 0").split()]
    cr, sr, cp, sp, cy, sy = math.cos(r), math.sin(r), math.cos(p), math.sin(p), math.cos(y), math.sin(y)
    R = np.array([
        [cy * cp, cy * sp * sr - sy * cr, cy * sp * cr + sy * sr],
        [sy * cp, sy * sp * sr + cy * cr, sy * sp * cr - cr * 0 - cy * sr],
        [-sp,     cp * sr,                cp * cr],
    ])
    # standard ZYX (yaw-pitch-roll) rotation
    Rz = np.array([[cy, -sy, 0], [sy, cy, 0], [0, 0, 1]])
    Ry = np.array([[cp, 0, sp], [0, 1, 0], [-sp, 0, cp]])
    Rx = np.array([[1, 0, 0], [0, cr, -sr], [0, sr, cr]])
    R = Rz @ Ry @ Rx
    T[:3, :3] = R
    T[:3, 3] = xyz
    return T


scene = trimesh.Scene()
stats = {"orig_tris": 0, "new_tris": 0, "meshes": 0}

# links -> visual mesh
link_mesh = {}
for link in root.findall("link"):
    name = link.get("name")
    vis = link.find("visual")
    if vis is None:
        continue
    geo = vis.find("geometry/mesh")
    if geo is None:
        continue
    fn = os.path.basename(geo.get("filename"))
    path = os.path.join(mesh_dir, fn)
    if not os.path.exists(path):
        print(f"  MISSING {fn}", file=sys.stderr)
        continue
    m = trimesh.load(path, force="mesh")
    stats["orig_tris"] += len(m.faces)
    if ratio < 1.0 and len(m.faces) > 200:
        v, f = fast_simplification.simplify(
            np.asarray(m.vertices, dtype=np.float32),
            np.asarray(m.faces, dtype=np.int32),
            1.0 - ratio,
        )
        m = trimesh.Trimesh(vertices=v, faces=f, process=False)
    scale = geo.get("scale")
    if scale:
        m.apply_scale([float(x) for x in scale.split()])
    m.apply_transform(rpy_xyz_to_matrix(vis.find("origin")))
    stats["new_tris"] += len(m.faces)
    stats["meshes"] += 1
    link_mesh[name] = m

# joint tree
parents, transforms = {}, {}
for j in root.findall("joint"):
    p = j.find("parent").get("link")
    c = j.find("child").get("link")
    parents[c] = p
    transforms[c] = rpy_xyz_to_matrix(j.find("origin"))

all_links = [l.get("name") for l in root.findall("link")]
base = [l for l in all_links if l not in parents]
base = base[0] if base else all_links[0]

for name in all_links:
    m = link_mesh.get(name)
    par = parents.get(name)
    scene.graph.update(
        frame_to=name,
        frame_from=par if par else "world",
        matrix=transforms.get(name, np.eye(4)),
    )
    if m is not None:
        scene.add_geometry(m, node_name=name + "_visual", parent_node_name=name)

scene.export(out_glb)
print(f"  meshes={stats['meshes']} tris {stats['orig_tris']} -> {stats['new_tris']}  "
      f"({out_glb}: {os.path.getsize(out_glb)/1e6:.2f} MB)")
