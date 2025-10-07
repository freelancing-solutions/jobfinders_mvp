#!/bin/bash

# Resume Builder Deployment Script
# This script automates the deployment process for the Resume Builder service

set -euo pipefail

# Configuration
APP_NAME="resume-builder"
DOCKER_REGISTRY="jobfinders"
VERSION=${1:-latest}
NAMESPACE="jobfinders"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi

    # Check if kubectl is installed
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed. Please install kubectl first."
        exit 1
    fi

    # Check if Docker daemon is running
    if ! docker info &> /dev/null; then
        log_error "Docker daemon is not running. Please start Docker first."
        exit 1
    fi

    # Check if we're logged into the container registry
    if ! docker info | grep -q "Username"; then
        log_warn "You may need to log into Docker registry: docker login"
    fi

    log_info "Prerequisites check completed."
}

# Build Docker image
build_image() {
    log_info "Building Docker image: ${DOCKER_REGISTRY}/${APP_NAME}:${VERSION}"

    # Build the image
    docker build \
        -f docker/resume-builder.dockerfile \
        -t "${DOCKER_REGISTRY}/${APP_NAME}:${VERSION}" \
        -t "${DOCKER_REGISTRY}/${APP_NAME}:latest" \
        .

    log_info "Docker image built successfully."
}

# Run security scan on the image
security_scan() {
    log_info "Running security scan on Docker image..."

    # Check if trivy is installed for security scanning
    if command -v trivy &> /dev/null; then
        trivy image "${DOCKER_REGISTRY}/${APP_NAME}:${VERSION}"
    else
        log_warn "Trivy is not installed. Skipping security scan."
        log_warn "Consider installing Trivy: https://github.com/aquasecurity/trivy"
    fi
}

# Push Docker image to registry
push_image() {
    log_info "Pushing Docker image to registry..."

    docker push "${DOCKER_REGISTRY}/${APP_NAME}:${VERSION}"
    docker push "${DOCKER_REGISTRY}/${APP_NAME}:latest"

    log_info "Docker image pushed successfully."
}

# Deploy to Kubernetes
deploy_kubernetes() {
    log_info "Deploying to Kubernetes namespace: ${NAMESPACE}"

    # Create namespace if it doesn't exist
    kubectl create namespace "${NAMESPACE}" --dry-run=client -o yaml | kubectl apply -f -

    # Apply ConfigMaps and Secrets
    if [ -f "k8s/configmap.yaml" ]; then
        log_info "Applying ConfigMaps..."
        kubectl apply -f k8s/configmap.yaml -n "${NAMESPACE}"
    fi

    if [ -f "k8s/secrets.yaml" ]; then
        log_info "Applying Secrets..."
        kubectl apply -f k8s/secrets.yaml -n "${NAMESPACE}"
    fi

    # Deploy the application
    log_info "Deploying application..."
    kubectl apply -f k8s/resume-builder-deployment.yaml -n "${NAMESPACE}"

    # Wait for deployment to be ready
    log_info "Waiting for deployment to be ready..."
    kubectl rollout status deployment/${APP_NAME} -n "${NAMESPACE}" --timeout=300s

    log_info "Deployment completed successfully."
}

# Verify deployment
verify_deployment() {
    log_info "Verifying deployment..."

    # Check pod status
    kubectl get pods -n "${NAMESPACE}" -l app="${APP_NAME}"

    # Check service status
    kubectl get services -n "${NAMESPACE}" -l app="${APP_NAME}"

    # Get the service URL
    SERVICE_URL=$(kubectl get service ${APP_NAME}-service -n "${NAMESPACE}" -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || echo "")

    if [ -n "$SERVICE_URL" ]; then
        log_info "Service is available at: http://$SERVICE_URL"
    else
        # Check if using port-forward for local testing
        log_info "For local testing, use: kubectl port-forward service/${APP_NAME}-service 3000:80 -n ${NAMESPACE}"
    fi

    # Run health check
    log_info "Running health check..."
    sleep 10  # Give the service time to start

    if kubectl exec -n "${NAMESPACE}" deployment/${APP_NAME} -- curl -f http://localhost:3000/api/health &>/dev/null; then
        log_info "Health check passed."
    else
        log_warn "Health check failed. Check pod logs for details."
        kubectl logs -n "${NAMESPACE}" -l app="${APP_NAME}" --tail=50
    fi
}

# Cleanup old images
cleanup() {
    log_info "Cleaning up old Docker images..."

    # Remove dangling images
    docker image prune -f

    # Remove old versions (keep last 3 versions)
    OLD_IMAGES=$(docker images "${DOCKER_REGISTRY}/${APP_NAME}" --format "table {{.Repository}}:{{.Tag}}" | grep -v latest | tail -n +4)
    if [ -n "$OLD_IMAGES" ]; then
        echo "$OLD_IMAGES" | xargs -r docker rmi
    fi

    log_info "Cleanup completed."
}

# Show usage
usage() {
    echo "Usage: $0 [VERSION]"
    echo ""
    echo "Options:"
    echo "  VERSION    Docker image version (default: latest)"
    echo ""
    echo "Examples:"
    echo "  $0           # Deploy with version 'latest'"
    echo "  $0 v1.2.3    # Deploy with specific version"
    echo ""
    echo "Environment variables:"
    echo "  DOCKER_REGISTRY    Docker registry name (default: jobfinders)"
    echo "  NAMESPACE          Kubernetes namespace (default: jobfinders)"
    echo ""
}

# Main execution
main() {
    log_info "Starting deployment of Resume Builder service..."

    # Parse command line arguments
    if [ "${1:-}" = "--help" ] || [ "${1:-}" = "-h" ]; then
        usage
        exit 0
    fi

    # Set trap for cleanup on exit
    trap cleanup EXIT

    # Execute deployment steps
    check_prerequisites
    build_image
    security_scan
    push_image
    deploy_kubernetes
    verify_deployment

    log_info "Deployment completed successfully!"
    log_info "Resume Builder is now running in namespace: ${NAMESPACE}"
}

# Run main function
main "$@"