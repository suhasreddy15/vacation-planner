#!/bin/bash
# VoyageIQ AWS EC2 Auto-Deployment Script
# This script installs Docker, clones the repository, configures the environment, and starts the application.

set -e

echo "=================================================="
echo "Starting VoyageIQ AWS EC2 Setup and Deployment..."
echo "=================================================="

# 1. Update package registry and install system dependencies
echo "Updating apt repositories..."
sudo apt-get update -y

echo "Installing Git and pre-requisites..."
sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common git

# 2. Install Docker
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update -y
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io
    
    # Enable and start Docker service
    sudo systemctl enable docker
    sudo systemctl start docker
    
    # Add current user to docker group
    sudo usermod -aG docker $USER
    echo "Docker installed successfully! Note: You may need to log out and log back in for user permissions to apply."
else
    echo "Docker is already installed."
fi

# 3. Install Docker Compose (v2)
if ! docker compose version &> /dev/null; then
    echo "Installing Docker Compose..."
    sudo mkdir -p /usr/local/lib/docker/cli-plugins/
    sudo curl -SL "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/lib/docker/cli-plugins/docker-compose
    sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
    echo "Docker Compose installed successfully!"
else
    echo "Docker Compose is already installed."
fi

# 4. Check if we are inside the repository or need to clone
if [ ! -f "docker-compose.yml" ]; then
    echo "docker-compose.yml not found in the current directory."
    read -p "Enter the Git Repository URL to clone: " REPO_URL
    if [ -z "$REPO_URL" ]; then
        echo "No repository URL provided. Exiting."
        exit 1
    fi
    git clone "$REPO_URL" voyageiq
    cd voyageiq
fi

# 5. Build and run containers
echo "Starting VoyageIQ services with Docker Compose..."
sudo docker compose up -d --build

echo "=================================================="
echo "Deployment initiated successfully!"
echo "You can check service status using: sudo docker compose ps"
echo "=================================================="
