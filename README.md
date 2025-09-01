# WORDFLUX Project

## 🚀 Project Setup (August 31, 2025)

This document tracks the infrastructure and development environment setup for the WORDFLUX project.

## 📦 Infrastructure

### EC2 Instance: wordflux
- **Instance ID**: `i-02e92d478cfe45af7`
- **Type**: t3.micro
- **OS**: Ubuntu 24.04.3 LTS
- **Region**: us-east-1
- **Public IP**: 54.163.132.143 (Elastic IP - permanent)
- **Security Group**: sg-00761d32aaca2eb32 (SSH enabled)

## 🛠️ Installed Tools

All tools are installed on the EC2 instance (not local Mac):

| Tool | Version | Status | Command |
|------|---------|--------|---------|
| **Ubuntu** | 24.04.3 LTS | ✅ Updated | - |
| **Node.js** | v22.19.0 | ✅ Installed | `node --version` |
| **npm** | 10.9.3 | ✅ Installed | `npm --version` |
| **AWS CLI** | v2.28.21 | ✅ Configured | `aws --version` |
| **Claude Code** | Latest | ✅ Ready | `claude` |
| **OpenAI Codex** | Latest | ✅ Ready | `codex` |

## 🔗 Connection Methods

### Quick Connect (Recommended)
```bash
ssh wordflux
```

### Direct Connection
```bash
ssh -i ~/.ssh/wordflux-key.pem ubuntu@54.163.132.143
```

### Multiple Terminal Sessions
Open as many terminals as needed and run `ssh wordflux` in each.

## 📁 File Locations

### Local (Mac)
- **SSH Key**: `~/.ssh/wordflux-key.pem`
- **SSH Config**: `~/.ssh/config.d/wordflux`
- **Management Script**: `./wordflux-ec2.sh`
- **Project Directory**: `/Users/d1f/Desktop/777/WORDFLUX/`

### Remote (EC2)
- **Home Directory**: `/home/ubuntu/`
- **npm Global Packages**: `~/.npm-global/`
- **AWS Config**: `~/.aws/`

## 🎮 Management Script

Use `./wordflux-ec2.sh` for easy management:

```bash
./wordflux-ec2.sh connect  # SSH to instance
./wordflux-ec2.sh status   # Check instance status
./wordflux-ec2.sh start    # Start instance
./wordflux-ec2.sh stop     # Stop instance
./wordflux-ec2.sh reboot   # Reboot instance
./wordflux-ec2.sh info     # Show instance details
```

## 🚀 Getting Started with AI Tools

### Claude Code
1. SSH to EC2: `ssh wordflux`
2. Start Claude: `claude`
3. Follow browser authentication
4. Start coding with AI assistance

### OpenAI Codex
1. SSH to EC2: `ssh wordflux`
2. Start Codex: `codex`
3. Sign in with ChatGPT account
4. Begin using AI pair programming

## 🔐 Security Notes

- SSH access only (port 22)
- Key-based authentication only
- AWS credentials configured on EC2
- Security group: sg-00761d32aaca2eb32

## 📊 AWS Account Info
- **Account ID**: 330140023537
- **IAM User**: renan
- **Region**: us-east-1

## 💡 Tips

1. **Always connect via SSH** to work on the EC2
2. **Tools are on EC2**, not on your local Mac
3. **Multiple terminals** can connect simultaneously
4. **Stop the instance** when not in use to save costs

## 📝 Next Steps

1. ✅ EC2 instance created and configured
2. ✅ Development tools installed
3. ✅ AI assistants ready (Claude & Codex)
4. ⏳ Project implementation begins...

---

*Created: August 31, 2025*  
*Environment: wordflux EC2 on AWS*  
*Ready for development!*