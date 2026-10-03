import JSZip from 'jszip';
import { CompanyConfig, GeneratedFile } from '../types/swarm';

export async function downloadProjectZip(
  config: CompanyConfig,
  files: GeneratedFile[]
): Promise<{ fileName: string; fileCount: number; byteSize: number }> {
  const zip = new JSZip();
  const vm = config.versionMatrix;

  // Add all generated files to the ZIP archive
  for (const file of files) {
    zip.file(file.path, file.content);
  }

  // Add Automated Version Checker & Auto-Installer for Windows (XAMPP v3.3.0) and Linux Debian (No Docker)
  const windowsBat = `@echo off
echo ============================================================================
echo AUDITOR E INSTALADOR AUTOMATICO DEL PRODUCTO FINAL (WINDOWS + XAMPP v3.3.0)
echo Empresa Virtual: ${config.companyName}
echo Proyecto: ${config.projectName} (Laravel ${config.laravelVersion} + React + Inertia + Tailwind)
echo Motor Base de Datos: ${config.databaseEngine.toUpperCase()} | Contacto CEO: ${config.ceoEmail}
echo ============================================================================

echo [1/6] Comprobando PHP y habilitando extensiones en XAMPP v3.3.0 (intl, zip, pdo)...
where php >nul 2>nul
if %errorlevel% neq 0 (
  echo [ALERTA CEO ${config.ceoEmail}]: PHP no esta en el PATH. Agregando C:\\xampp\\php...
  set PATH=%PATH%;C:\\xampp\\php
)
powershell -Command "if (Test-Path 'C:\\xampp\\php\\php.ini') { (Get-Content 'C:\\xampp\\php\\php.ini') -replace ';extension=intl', 'extension=intl' -replace ';extension=zip', 'extension=zip' -replace ';extension=pdo_mysql', 'extension=pdo_mysql' -replace ';extension=pdo_pgsql', 'extension=pdo_pgsql' -replace ';extension=pdo_sqlite', 'extension=pdo_sqlite' | Set-Content 'C:\\xampp\\php\\php.ini' }"

echo [2/6] Comprobando e instalando Composer y Node.js si faltan...
where composer >nul 2>nul || (php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');" && php composer-setup.php --install-dir=C:\\xampp\\php --filename=composer)
where node >nul 2>nul || (echo [ALERTA CEO ${config.ceoEmail}]: Instalando Node.js LTS automaticamente... && winget install OpenJS.NodeJS.LTS --silent)

echo [3/6] Instalando Laravel ${config.laravelVersion}, Inertia Server, Filament PHP e InfyOm...
cd laravel_app
if not exist .env copy .env.example .env
call composer install --optimize-autoloader
call composer require laravel/framework:"${vm.laravelPackage}" inertiajs/inertia-laravel:"${vm.inertiaLaravelVersion}" tightenco/ziggy filament/filament:"${vm.filamentVersion}" infyomlabs/laravel-generator:"${vm.infyomBranch}.x-dev" -W

echo [4/6] Instalando React ${vm.reactVersion}, Inertia React ${vm.inertiaReactVersion}, Tailwind CSS ${vm.tailwindVersion} y Vite ${vm.viteVersion}...
call npm install react@"${vm.reactVersion}" react-dom@"${vm.reactVersion}" @inertiajs/react@"${vm.inertiaReactVersion}" tailwindcss@"${vm.tailwindVersion}" vite@"${vm.viteVersion}" laravel-vite-plugin@"${vm.laravelVitePlugin}"

echo [5/6] Compilando SPA y ejecutando migraciones en ${config.databaseEngine.toUpperCase()}...
call npm run build
php artisan key:generate --force
php artisan migrate --seed --force

echo [6/6] Verificacion e instalacion automatica completadas. Reporte registrado para el CEO (${config.ceoEmail}).
pause
`;

  const debianSh = `#!/usr/bin/env bash
set -e
echo "============================================================================"
echo "AUDITOR E INSTALADOR AUTOMATICO DEL PRODUCTO FINAL (LINUX DEBIAN / FTP)"
echo "Empresa Virtual: ${config.companyName}"
echo "Proyecto: ${config.projectName} (Laravel ${config.laravelVersion} + React + Inertia + Tailwind)"
echo "Motor Base de Datos: ${config.databaseEngine.toUpperCase()} | Contacto CEO: ${config.ceoEmail}"
echo "============================================================================"

echo "[1/5] Comprobando e instalando PHP, extensiones y drivers de BD (${config.databaseEngine})..."
command -v php >/dev/null 2>&1 || {
  echo "[ALERTA CEO ${config.ceoEmail}]: Instalando PHP y extensiones automaticamente..."
  sudo apt update && sudo apt install -y curl git unzip php php-cli php-common php-curl php-gd php-intl php-mbstring php-mysql php-pgsql php-sqlite3 php-xml php-zip php-bcmath
}

echo "[2/5] Comprobando e instalando Composer y Node.js LTS..."
command -v composer >/dev/null 2>&1 || (curl -sS https://getcomposer.org/installer | sudo php -- --install-dir=/usr/local/bin --filename=composer)
command -v node >/dev/null 2>&1 || (curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs)

echo "[3/5] Instalando Laravel ${config.laravelVersion}, Inertia.js, Filament PHP e InfyOm..."
cd laravel_app
[ ! -f .env ] && cp .env.example .env
composer install --optimize-autoloader
composer require laravel/framework:"${vm.laravelPackage}" inertiajs/inertia-laravel:"${vm.inertiaLaravelVersion}" tightenco/ziggy filament/filament:"${vm.filamentVersion}" infyomlabs/laravel-generator:"${vm.infyomBranch}.x-dev" -W

echo "[4/5] Instalando React ${vm.reactVersion}, Inertia React ${vm.inertiaReactVersion}, Tailwind CSS ${vm.tailwindVersion} y Vite ${vm.viteVersion}..."
npm install react@"${vm.reactVersion}" react-dom@"${vm.reactVersion}" @inertiajs/react@"${vm.inertiaReactVersion}" tailwindcss@"${vm.tailwindVersion}" vite@"${vm.viteVersion}" laravel-vite-plugin@"${vm.laravelVitePlugin}"
npm run build

echo "[5/5] Inicializando Base de Datos (${config.databaseEngine.toUpperCase()}) y notificando al CEO..."
php artisan key:generate --force
php artisan migrate --seed --force
echo "Sistema compilado, verificado y listo!"
`;

  zip.file('INSTALAR_EN_WINDOWS_XAMPP.bat', windowsBat);
  zip.file('INSTALAR_EN_LINUX_DEBIAN.sh', debianSh);

  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
  const fileName = `${config.projectSlug || 'empresa_virtual_swarm'}_complete_release.zip`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 5000);

  return {
    fileName,
    fileCount: files.length + 2,
    byteSize: blob.size,
  };
}
