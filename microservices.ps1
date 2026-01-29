# Script de gestión para la arquitectura de microservicios (Windows)
# TutoriasFIS - EPN 2026

param(
    [Parameter(Position=0)]
    [string]$Command = "help"
)

function Print-Header {
    Write-Host "╔══════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║                                              ║" -ForegroundColor Green
    Write-Host "║   🎓 TutoriasFIS - Microservicios Manager   ║" -ForegroundColor Green
    Write-Host "║                                              ║" -ForegroundColor Green
    Write-Host "╚══════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
}

function Install-Dependencies {
    Write-Host "📦 Instalando dependencias en todos los servicios..." -ForegroundColor Yellow
    
    Set-Location backend\api-gateway
    npm install
    Set-Location ..\..
    
    Set-Location backend\identity-service
    npm install
    Set-Location ..\..
    
    Set-Location backend\academic-service
    npm install
    Set-Location ..\..
    
    Set-Location backend\messaging-service
    npm install
    Set-Location ..\..
    
    Set-Location frontend
    npm install
    Set-Location ..
    
    Write-Host "✅ Dependencias instaladas" -ForegroundColor Green
}

function Setup-Env {
    Write-Host "⚙️  Configurando archivos .env..." -ForegroundColor Yellow
    
    $services = @(
        "backend\api-gateway",
        "backend\identity-service",
        "backend\academic-service",
        "backend\messaging-service"
    )
    
    foreach ($service in $services) {
        $envPath = "$service\.env"
        $examplePath = "$service\.env.example"
        
        if (-not (Test-Path $envPath)) {
            Copy-Item $examplePath $envPath
            Write-Host "✅ Creado $envPath" -ForegroundColor Green
        } else {
            Write-Host "⚠️  $envPath ya existe" -ForegroundColor Yellow
        }
    }
}

function Start-Dev {
    Write-Host "🚀 Iniciando servicios en modo desarrollo..." -ForegroundColor Yellow
    Write-Host "Requiere 5 terminales separadas. Ejecuta estos comandos:`n" -ForegroundColor Yellow
    
    Write-Host "Terminal 1 - Identity Service:" -ForegroundColor Cyan
    Write-Host "cd backend\identity-service; npm run start:dev`n"
    
    Write-Host "Terminal 2 - Academic Service:" -ForegroundColor Cyan
    Write-Host "cd backend\academic-service; npm run start:dev`n"
    
    Write-Host "Terminal 3 - Messaging Service:" -ForegroundColor Cyan
    Write-Host "cd backend\messaging-service; npm run start:dev`n"
    
    Write-Host "Terminal 4 - API Gateway:" -ForegroundColor Cyan
    Write-Host "cd backend\api-gateway; npm run start:dev`n"
    
    Write-Host "Terminal 5 - Frontend:" -ForegroundColor Cyan
    Write-Host "cd frontend; npm run dev`n"
}

function Start-Docker {
    Write-Host "🐳 Iniciando con Docker Compose..." -ForegroundColor Yellow
    docker-compose up --build
}

function Stop-Docker {
    Write-Host "🛑 Deteniendo contenedores..." -ForegroundColor Yellow
    docker-compose down
}

function Clean-All {
    Write-Host "🧹 Limpiando node_modules y dist..." -ForegroundColor Yellow
    
    Get-ChildItem -Path backend -Recurse -Directory -Filter "node_modules" | Remove-Item -Recurse -Force
    Get-ChildItem -Path backend -Recurse -Directory -Filter "dist" | Remove-Item -Recurse -Force
    Get-ChildItem -Path frontend -Recurse -Directory -Filter "node_modules" | Remove-Item -Recurse -Force
    Get-ChildItem -Path frontend -Recurse -Directory -Filter ".next" | Remove-Item -Recurse -Force
    
    Write-Host "✅ Limpieza completada" -ForegroundColor Green
}

function Build-All {
    Write-Host "🔨 Compilando todos los servicios..." -ForegroundColor Yellow
    
    Set-Location backend\api-gateway
    npm run build
    Set-Location ..\..
    
    Set-Location backend\identity-service
    npm run build
    Set-Location ..\..
    
    Set-Location backend\academic-service
    npm run build
    Set-Location ..\..
    
    Set-Location backend\messaging-service
    npm run build
    Set-Location ..\..
    
    Set-Location frontend
    npm run build
    Set-Location ..
    
    Write-Host "✅ Compilación completada" -ForegroundColor Green
}

function Show-Urls {
    Write-Host "📍 URLs de Acceso:" -ForegroundColor Green
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
    Write-Host "Frontend:          http://localhost:3001"
    Write-Host "API Gateway:       http://localhost:4000"
    Write-Host "Identity Service:  http://localhost:4001"
    Write-Host "Academic Service:  http://localhost:4002"
    Write-Host "Messaging Service: http://localhost:4003"
    Write-Host "MongoDB:           mongodb://localhost:27017"
    Write-Host "Prometheus:        http://localhost:9090"
    Write-Host "Grafana:           http://localhost:3002"
    Write-Host ""
}

function Show-Help {
    Write-Host "Uso: .\microservices.ps1 [comando]`n"
    Write-Host "Comandos disponibles:"
    Write-Host "  install     - Instalar dependencias en todos los servicios"
    Write-Host "  setup       - Configurar archivos .env"
    Write-Host "  dev         - Mostrar instrucciones para desarrollo local"
    Write-Host "  docker      - Iniciar con Docker Compose"
    Write-Host "  stop        - Detener contenedores Docker"
    Write-Host "  build       - Compilar todos los servicios"
    Write-Host "  clean       - Limpiar node_modules y carpetas de compilación"
    Write-Host "  urls        - Mostrar URLs de acceso"
    Write-Host "  help        - Mostrar esta ayuda"
}

Print-Header

switch ($Command) {
    "install" { Install-Dependencies }
    "setup" { Setup-Env }
    "dev" { Start-Dev }
    "docker" { Start-Docker }
    "stop" { Stop-Docker }
    "build" { Build-All }
    "clean" { Clean-All }
    "urls" { Show-Urls }
    default { Show-Help }
}
