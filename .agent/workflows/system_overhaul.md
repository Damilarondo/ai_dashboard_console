---
description: XP Workflow for System Overhaul and Multi-Tenant Isolation
---
// turbo-all
# XP Workflow: System Overhaul

Follow these steps for every iterative change to ensure high-fidelity code and accountability.

1. **Audit & Lint**:
   - For Backend: Run `python3 -m py_compile main.py` to check for syntax errors.
   - For Frontend: Run `npm run lint` or `npx tsc --noEmit` in `ai_dashboard` to check for type errors.

2. **Server Verification**:
   - Attempt to start the Control Plane: `python3 main.py` (check if it crashes on boot).
   - Check if the dashboard builds: `npm run build` (or `dev` check).

3. **Tenant Privacy Validation**:
   - Execute the Cross-Tenant Isolation Test script (to be created) to prove Partition A cannot see Partition B.

4. **Iterative Refinement**:
   - Make small, targeted changes.
   - Verify after EVERY change.
   - Never leave dead codes or simulation markers ("Thinking...", "Simulation").
