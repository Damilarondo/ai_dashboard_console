---
description: Connect and Deploy to the DigitalOcean Victim Server
---
// turbo-all
# Workflow: DigitalOcean Deployment

1. **Deploy Agent Code**:
   `sshpass -f ~/.ssh/.fyprojectpass scp ai_agent_client/agent.py root@project.nips.dpdns.org:/opt/ai_agent/agent.py`
   `sshpass -f ~/.ssh/.fyprojectpass scp ai_agent_client/watchers.py root@project.nips.dpdns.org:/opt/ai_agent/watchers.py`
   `sshpass -f ~/.ssh/.fyprojectpass scp ai_agent_client/install.sh root@project.nips.dpdns.org:/opt/ai_agent/install.sh`

2. **Restart Service**:
   `sshpass -f ~/.ssh/.fyprojectpass ssh root@project.nips.dpdns.org "systemctl restart ai-agent"`

3. **Verify Logs**:
   `sshpass -f ~/.ssh/.fyprojectpass ssh root@project.nips.dpdns.org "tail -n 20 /var/log/syslog | grep ai-agent"`
