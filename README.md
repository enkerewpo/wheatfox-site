# wheatfox-site

Source for [www.oscommunity.cn](https://www.oscommunity.cn) — Yulong Han's
personal site. Astro, static output, no client framework.

## Robonix Playground

The interesting part is [`/playground/`](https://www.oscommunity.cn/playground/).
It is not a video and not a mock: **the browser registers with a live
[Robonix](https://github.com/syswonder/robonix) runtime as three capability
providers**, and every motion on screen is the result of an executor dispatch.

    browser_sim    primitive  chassis/move, chassis/stop, arm/{pos,joint}_command,
                              arm/end_pose — metres, radians and joint names only
    browser_nav    service    navigate + status + cancel, the same contracts as the
                              nav2 wrapper, backed by A* over an occupancy grid
    browser_scene  system     list_objects, get_object_context, get_robot_context,
                              goal_near — simulation ground truth, not perception

A VLM plans, the runtime executes. The plan you see in the timeline is the RTDL
tree pilot got back from the model, with node states updating as the executor
walks it. When a step fails — out of reach, goal inside furniture, gripper
closed on nothing — the failure is reported honestly and the model replans.
Sending a second message while it works steers the plan mid-flight.

The parts that run on a server (three provider packages, a WebSocket→gRPC
gateway, the deployment manifest and the robot's Soma description) are not in
this repository; this is the browser side.

## Layout

    src/config.ts        site-wide UI, ICP filing, colours, images, fonts
    src/data/profile.ts  bio, publications, projects, contributions
    src/styles/          tokens.css is the single source of design values
    src/lib/lab/         the playground: sim, navigation, semantic map, link
    src/content/blog/    posts

Anything you would want to change about how the site looks lives in
`src/styles/tokens.css` and `src/config.ts`.

## Develop

    pnpm install
    pnpm dev

## Deploy

Deployment targets come from the environment so they are not baked into a
public repository:

    cp .env.deploy.example .env.deploy   # then fill in your own values
    ./scripts/deploy-live.sh             # build, upload, swap atomically

`DEPLOY_ROOT` ends up inside `rm -rf` on the remote, so the script refuses
anything that is not an absolute path.

## Licence

Code is MIT. Post text, images and the CV content are © Yulong Han — please
don't republish those without asking.
