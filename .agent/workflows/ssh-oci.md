---
description: Connect and Deploy to the OCI Backend Brain
---
// turbo-all
# Workflow: OCI Control Plane Deployment

1. **Deploy Control Plane Code**:
   `scp ai_control_plane/main.py oracleProject:~/ai_control_plane/main.py`

2. **Restart Control Plane**:
   `ssh oracleProject "pkill -f uvicorn || true; cd ~/ai_control_plane && nohup python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 &"`

3. **Verify Connectivity**:
   `ssh oracleProject "curl -s -I http://localhost:8000/health | head -n 1"`
