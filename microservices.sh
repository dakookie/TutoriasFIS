#!/bin/bash

# Script de gestión para la arquitectura de microservicios
# TutoriasFIS - EPN 2026

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

function print_header() {
    echo -e "${GREEN}"
    echo "╔══════════════════════════════════════════════╗"
    echo "║                                              ║"
    echo "║   🎓 TutoriasFIS - Microservicios Manager   ║"
    echo "║                                              ║"
    echo "╚══════════════════════════════════════════════╝"
    echo -e "${NC}"
}

function install_dependencies() {
    echo -e "${YELLOW}📦 Instalando dependencias en todos los servicios...${NC}"
    
    cd backend/api-gateway && npm install && cd ../..
    cd backend/identity-service && npm install && cd ../..
    cd backend/academic-service && npm install && cd ../..
    cd backend/messaging-service && npm install && cd ../..
    cd frontend && npm install && cd ..
    
    echo -e "${GREEN}✅ Dependencias instaladas${NC}"
}

function setup_env() {
    echo -e "${YELLOW}⚙️  Configurando archivos .env...${NC}"
    
    for service in backend/api-gateway backend/identity-service backend/academic-service backend/messaging-service; do
        if [ ! -f "$service/.env" ]; then
            cp "$service/.env.example" "$service/.env"
            echo -e "${GREEN}✅ Creado $service/.env${NC}"
        else
            echo -e "${YELLOW}⚠️  $service/.env ya existe${NC}"
        fi
    done
}

function start_dev() {
    echo -e "${YELLOW}🚀 Iniciando servicios en modo desarrollo...${NC}"
    echo -e "${YELLOW}Requiere 5 terminales separadas. Ejecuta estos comandos:${NC}\n"
    
    echo "Terminal 1 - Identity Service:"
    echo "cd backend/identity-service && npm run start:dev"
    echo ""
    echo "Terminal 2 - Academic Service:"
    echo "cd backend/academic-service && npm run start:dev"
    echo ""
    echo "Terminal 3 - Messaging Service:"
    echo "cd backend/messaging-service && npm run start:dev"
    echo ""
    echo "Terminal 4 - API Gateway:"
    echo "cd backend/api-gateway && npm run start:dev"
    echo ""
    echo "Terminal 5 - Frontend:"
    echo "cd frontend && npm run dev"
}

function start_docker() {
    echo -e "${YELLOW}🐳 Iniciando con Docker Compose...${NC}"
    docker-compose up --build
}

function stop_docker() {
    echo -e "${YELLOW}🛑 Deteniendo contenedores...${NC}"
    docker-compose down
}

function clean() {
    echo -e "${YELLOW}🧹 Limpiando node_modules y dist...${NC}"
    
    find backend -name "node_modules" -type d -prune -exec rm -rf '{}' +
    find backend -name "dist" -type d -prune -exec rm -rf '{}' +
    find frontend -name "node_modules" -type d -prune -exec rm -rf '{}' +
    find frontend -name ".next" -type d -prune -exec rm -rf '{}' +
    
    echo -e "${GREEN}✅ Limpieza completada${NC}"
}

function build() {
    echo -e "${YELLOW}🔨 Compilando todos los servicios...${NC}"
    
    cd backend/api-gateway && npm run build && cd ../..
    cd backend/identity-service && npm run build && cd ../..
    cd backend/academic-service && npm run build && cd ../..
    cd backend/messaging-service && npm run build && cd ../..
    cd frontend && npm run build && cd ..
    
    echo -e "${GREEN}✅ Compilación completada${NC}"
}

function show_urls() {
    echo -e "${GREEN}"
    echo "📍 URLs de Acceso:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Frontend:         http://localhost:3001"
    echo "API Gateway:      http://localhost:4000"
    echo "Identity Service: http://localhost:4001"
    echo "Academic Service: http://localhost:4002"
    echo "Messaging Service: http://localhost:4003"
    echo "MongoDB:          mongodb://localhost:27017"
    echo "Prometheus:       http://localhost:9090"
    echo "Grafana:          http://localhost:3002"
    echo -e "${NC}"
}

function show_help() {
    echo "Uso: ./microservices.sh [comando]"
    echo ""
    echo "Comandos disponibles:"
    echo "  install     - Instalar dependencias en todos los servicios"
    echo "  setup       - Configurar archivos .env"
    echo "  dev         - Mostrar instrucciones para desarrollo local"
    echo "  docker      - Iniciar con Docker Compose"
    echo "  stop        - Detener contenedores Docker"
    echo "  build       - Compilar todos los servicios"
    echo "  clean       - Limpiar node_modules y carpetas de compilación"
    echo "  urls        - Mostrar URLs de acceso"
    echo "  help        - Mostrar esta ayuda"
}

print_header

case "$1" in
    install)
        install_dependencies
        ;;
    setup)
        setup_env
        ;;
    dev)
        start_dev
        ;;
    docker)
        start_docker
        ;;
    stop)
        stop_docker
        ;;
    build)
        build
        ;;
    clean)
        clean
        ;;
    urls)
        show_urls
        ;;
    help|*)
        show_help
        ;;
esac
