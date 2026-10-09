# Agent guidance

Read `.agents/refactor-policy.md` before changing interfaces. This extracted package is experimental.
Keep this repository limited to the low-level OpenCV build, runtime loader, models, and types.
QR preprocessing and morphology sweep policy belong to refinio/lft.
Run the runtime smoke check and package inspection before delivery. Consumers must not compile OpenCV during installation.
