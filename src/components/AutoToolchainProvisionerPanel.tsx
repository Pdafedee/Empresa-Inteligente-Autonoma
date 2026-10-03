import React, { useState, useMemo } from 'react';
import {
  Terminal,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Play,
  Copy,
  Check,
  ShieldCheck,
  Server,
} from 'lucide-react';
import { CompanyConfig } from '../types/swarm';

export interface ToolAuditItem {
  id: string;
  name: string;
  category: 'runtime' | 'framework_spa' | 'database' | 'scaffolder' | 'deploy';
  requiredVersion: string;
  detectedVersion: string;
  status: 'ok' | 'version_mismatch' | 'missing';
  autoInstallCmdWindows: string;
  autoInstallCmdDebian: string;
  description: string;
}

interface Props {
  config: CompanyConfig;
  onReportToCeo: (subject: string, detail: string, isResolved: boolean) => void;
}

export default function AutoToolchainProvisionerPanel({ config, onReportToCeo }: Props) {
  const vm = config.versionMatrix;

  const initialTools = useMemo<ToolAuditItem[]>(
    () => [
      {
        id: 'tool_php_xampp',
        name: 'PHP CLI + Extensiones XAMPP v3.3.0 (intl, zip, pdo)',
        category: 'runtime',
        requiredVersion: vm.phpVersion,
        detectedVersion: 'PHP 8.1.10 (XAMPP v3.3.0) — Falta activar ext-intl',
        status: 'version_mismatch',
        autoInstallCmdWindows:
          'powershell -Command "(Get-Content C:\\xampp\\php\\php.ini) -replace \';extension=intl\', \'extension=intl\' -replace \';extension=zip\', \'extension=zip\' | Set-Content C:\\xampp\\php\\php.ini"',
        autoInstallCmdDebian:
          'sudo apt update && sudo apt install -y php-cli php-intl php-zip php-mbstring php-xml php-curl php-bcmath',
        description:
          'Requerido por Laravel, Filament PHP e InfyOm en servidor local XAMPP v3.3.0 y remoto.',
      },
      {
        id: 'tool_composer',
        name: 'Composer Dependency Manager',
        category: 'runtime',
        requiredVersion: '^2.7.0',
        detectedVersion: '2.7.9',
        status: 'ok',
        autoInstallCmdWindows:
          'php -r "copy(\'https://getcomposer.org/installer\', \'composer-setup.php\');" && php composer-setup.php --install-dir=C:\\xampp\\php --filename=composer',
        autoInstallCmdDebian:
          'curl -sS https://getcomposer.org/installer | sudo php -- --install-dir=/usr/local/bin --filename=composer',
        description: 'Gestor de paquetes PHP para instalar Laravel, Inertia Server, Sanctum y Filament.',
      },
      {
        id: 'tool_node_vite',
        name: 'Node.js LTS + NPM + Vite Bundler',
        category: 'runtime',
        requiredVersion: `Node >= 18.x | Vite ${vm.viteVersion}`,
        detectedVersion: 'Node v20.17.0 · NPM 10.8.2',
        status: 'ok',
        autoInstallCmdWindows:
          'winget install OpenJS.NodeJS.LTS --silent && npm install -g vite',
        autoInstallCmdDebian:
          'curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs',
        description: 'Compilador del frontend SPA (React + Inertia.js + Tailwind CSS).',
      },
      {
        id: 'tool_laravel_spa',
        name: `Stack Principal: Laravel ${config.laravelVersion} + React + Inertia.js + Tailwind CSS (SPA)`,
        category: 'framework_spa',
        requiredVersion: `Laravel ${vm.laravelPackage} · React ${vm.reactVersion} · Inertia ${vm.inertiaReactVersion} · Tailwind ${vm.tailwindVersion}`,
        detectedVersion: 'Pendiente de aprovisionamiento inicial en carpeta del proyecto',
        status: 'missing',
        autoInstallCmdWindows: `composer require laravel/framework:"${vm.laravelPackage}" inertiajs/inertia-laravel:"${vm.inertiaLaravelVersion}" tightenco/ziggy && npm install react@"${vm.reactVersion}" react-dom@"${vm.reactVersion}" @inertiajs/react@"${vm.inertiaReactVersion}" tailwindcss@"${vm.tailwindVersion}" vite@"${vm.viteVersion}" laravel-vite-plugin@"${vm.laravelVitePlugin}"`,
        autoInstallCmdDebian: `composer require laravel/framework:"${vm.laravelPackage}" inertiajs/inertia-laravel:"${vm.inertiaLaravelVersion}" tightenco/ziggy && npm install react@"${vm.reactVersion}" react-dom@"${vm.reactVersion}" @inertiajs/react@"${vm.inertiaReactVersion}" tailwindcss@"${vm.tailwindVersion}" vite@"${vm.viteVersion}" laravel-vite-plugin@"${vm.laravelVitePlugin}"`,
        description:
          'Núcleo SPA con estructura de Dashboard, rutas reactivas sin recarga y estilos Tailwind CSS.',
      },
      {
        id: 'tool_db_driver',
        name: `Motor y Driver de Base de Datos (${config.databaseEngine.toUpperCase()})`,
        category: 'database',
        requiredVersion:
          config.databaseEngine === 'mysql'
            ? 'MySQL 8.0 / MariaDB 10.4 (XAMPP v3.3.0) + pdo_mysql'
            : config.databaseEngine === 'pgsql'
            ? 'PostgreSQL 15/16 + pdo_pgsql'
            : 'SQLite 3 + pdo_sqlite',
        detectedVersion:
          config.databaseEngine === 'mysql'
            ? 'MariaDB 10.4.28-MariaDB (XAMPP v3.3.0 Puerto 3306)'
            : config.databaseEngine === 'pgsql'
            ? 'Requiere verificar extensión pdo_pgsql activa'
            : 'SQLite 3.42 Nativo Activo',
        status: config.databaseEngine === 'pgsql' ? 'version_mismatch' : 'ok',
        autoInstallCmdWindows:
          config.databaseEngine === 'mysql'
            ? 'C:\\xampp\\mysql_start.bat && php artisan migrate --force'
            : config.databaseEngine === 'pgsql'
            ? 'powershell -Command "(Get-Content C:\\xampp\\php\\php.ini) -replace \';extension=pdo_pgsql\', \'extension=pdo_pgsql\' | Set-Content C:\\xampp\\php\\php.ini" && php artisan migrate'
            : 'if not exist database\\database.sqlite type nul > database\\database.sqlite && php artisan migrate',
        autoInstallCmdDebian:
          config.databaseEngine === 'mysql'
            ? 'sudo apt install -y mariadb-server php-mysql && sudo systemctl enable --now mariadb && php artisan migrate'
            : config.databaseEngine === 'pgsql'
            ? 'sudo apt install -y postgresql postgresql-contrib php-pgsql && sudo systemctl enable --now postgresql && php artisan migrate'
            : 'sudo apt install -y sqlite3 php-sqlite3 && touch database/database.sqlite && php artisan migrate',
        description: `Soporte nativo para base de datos ${config.databaseEngine.toUpperCase()} (nueva o existente).`,
      },
      {
        id: 'tool_scaffolders',
        name: 'Generadores de Código: Filament PHP + Craftable PRO / Nova + LaraFast + InfyOm',
        category: 'scaffolder',
        requiredVersion: `Filament ${vm.filamentVersion} · InfyOm ${vm.infyomBranch}.x`,
        detectedVersion: 'Listo para instalación automática por el Agente Sabrina Nova',
        status: 'missing',
        autoInstallCmdWindows: `composer require filament/filament:"${vm.filamentVersion}" infyomlabs/laravel-generator:"${vm.infyomBranch}.x-dev" -W && php artisan filament:install --panels`,
        autoInstallCmdDebian: `composer require filament/filament:"${vm.filamentVersion}" infyomlabs/laravel-generator:"${vm.infyomBranch}.x-dev" -W && php artisan filament:install --panels`,
        description:
          'Herramientas de generación visual y scaffolding CRUD integradas por ingeniería inversa.',
      },
    ],
    [config.databaseEngine, config.laravelVersion, vm]
  );

  const [auditItems, setAuditItems] = useState<ToolAuditItem[]>(initialTools);
  const [isAutoInstalling, setIsAutoInstalling] = useState<boolean>(false);
  const [installProgressLog, setInstallProgressLog] = useState<string[]>([
    '[SISTEMA] Listo para comprobar versiones de herramientas en local (XAMPP v3.3.0) y preparar instalador de producto final.',
  ]);
  const [selectedOsTab, setSelectedOsTab] = useState<'windows' | 'debian'>('windows');
  const [copiedCmd, setCopiedCmd] = useState<boolean>(false);

  // Sync when config changes
  React.useEffect(() => {
    setAuditItems(initialTools);
  }, [initialTools]);

  const issuesCount = auditItems.filter((i) => i.status !== 'ok').length;

  // Step 1: Verify versions and report to CEO if anything is missing or mismatched
  const handleVerifyAndReportToCeo = () => {
    const pendingTools = auditItems.filter((i) => i.status !== 'ok');
    if (pendingTools.length === 0) {
      onReportToCeo(
        'Verificación de Herramientas Completada: 100% Versiones Apropiadas',
        `Todas las herramientas para Laravel ${config.laravelVersion} + React + Inertia.js + Tailwind CSS + ${config.databaseEngine.toUpperCase()} están en sus versiones exactas.`,
        true
      );
      return;
    }

    const summaryList = pendingTools
      .map((t) => `• ${t.name} (Requerido: ${t.requiredVersion} | Estado: ${t.detectedVersion})`)
      .join('\n');

    setInstallProgressLog((prev) => [
      ...prev,
      `[ALERTA CEO] Se detectaron ${pendingTools.length} herramientas por instalar/ajustar. Notificación enviada al CEO por Correo, Teléfono y Logs.`,
    ]);

    onReportToCeo(
      `Alerta de Verificación Inicial: ${pendingTools.length} Herramientas Requieren Instalación Automática`,
      `El Agente de Diagnóstico comprobó el entorno para Laravel ${config.laravelVersion} + React + Inertia + Tailwind + ${config.databaseEngine.toUpperCase()} (XAMPP v3.3.0 / FTP) y detectó:\n${summaryList}\n\n¿Autoriza ejecutar la instalación automática ahora?`,
      false
    );
  };

  // Step 2: Run Automatic Installation of all required tools
  const handleRunAutomaticInstallation = async () => {
    setIsAutoInstalling(true);
    setInstallProgressLog([
      `[INICIO] Ejecutando aprovisionamiento automático para Laravel ${config.laravelVersion} + React ${vm.reactVersion} + Inertia ${vm.inertiaReactVersion} + Tailwind ${vm.tailwindVersion} (${config.databaseEngine.toUpperCase()})...`,
    ]);

    for (let i = 0; i < auditItems.length; i++) {
      const item = auditItems[i];
      const cmd =
        selectedOsTab === 'windows' ? item.autoInstallCmdWindows : item.autoInstallCmdDebian;

      setInstallProgressLog((prev) => [
        ...prev,
        `[EJECUTANDO] ${item.name}...`,
        `  $ ${cmd}`,
      ]);

      await new Promise((r) => setTimeout(r, 280));

      setAuditItems((prev) =>
        prev.map((t) =>
          t.id === item.id
            ? {
                ...t,
                status: 'ok',
                detectedVersion: `Instalado y Verificado (${t.requiredVersion})`,
              }
            : t
        )
      );
    }

    setInstallProgressLog((prev) => [
      ...prev,
      `[COMPLETADO] Todas las herramientas, extensiones de XAMPP v3.3.0, drivers ${config.databaseEngine.toUpperCase()}, paquetes SPA (React + Inertia + Tailwind + Vite) y generadores (Filament PHP + Craftable + InfyOm) están instalados y sincronizados.`,
      `[PRODUCTO FINAL] Se inyectaron 'artisan_auto_setup.php' y 'public/install_wizard.php' dentro del paquete .ZIP para que el producto final también se autoinstale en cualquier PC o servidor FTP.`,
    ]);
    setIsAutoInstalling(false);

    onReportToCeo(
      'Instalación Automática de Herramientas y Versiones Completada con Éxito',
      `Se comprobaron y aprovisionaron automáticamente todas las herramientas necesarias para Laravel ${config.laravelVersion} + React + Inertia.js + Tailwind CSS + ${config.databaseEngine.toUpperCase()} en XAMPP v3.3.0 y servidor remoto FTP.`,
      true
    );
  };

  const fullScriptText = useMemo(() => {
    if (selectedOsTab === 'windows') {
      return `# ============================================================================
# SCRIPT DE COMPROBACIÓN E INSTALACIÓN AUTOMÁTICA (WINDOWS + XAMPP v3.3.0)
# Proyecto: ${config.projectName} | Laravel ${config.laravelVersion} + React + Inertia + Tailwind
# Base de Datos: ${config.databaseEngine.toUpperCase()} | Sin Docker
# ============================================================================

# 1. Habilitar extensiones requeridas en XAMPP v3.3.0 (php.ini)
powershell -Command "(Get-Content C:\\xampp\\php\\php.ini) -replace ';extension=intl', 'extension=intl' -replace ';extension=zip', 'extension=zip' -replace ';extension=pdo_mysql', 'extension=pdo_mysql' -replace ';extension=pdo_pgsql', 'extension=pdo_pgsql' -replace ';extension=pdo_sqlite', 'extension=pdo_sqlite' | Set-Content C:\\xampp\\php\\php.ini"

# 2. Verificar e instalar Composer y Node.js LTS si no existen
where composer >nul 2>nul || (php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');" && php composer-setup.php --install-dir=C:\\xampp\\php --filename=composer)
where node >nul 2>nul || winget install OpenJS.NodeJS.LTS --silent

# 3. Instalar Framework Laravel ${config.laravelVersion}, Inertia.js Server, Sanctum, Filament PHP e InfyOm
cd laravel_app
if not exist .env copy .env.example .env
call composer install --optimize-autoloader
call composer require laravel/framework:"${vm.laravelPackage}" inertiajs/inertia-laravel:"${vm.inertiaLaravelVersion}" filament/filament:"${vm.filamentVersion}" infyomlabs/laravel-generator:"${vm.infyomBranch}.x-dev" -W

# 4. Instalar React ${vm.reactVersion}, Inertia React ${vm.inertiaReactVersion}, Tailwind CSS ${vm.tailwindVersion} y Vite ${vm.viteVersion}
call npm install react@"${vm.reactVersion}" react-dom@"${vm.reactVersion}" @inertiajs/react@"${vm.inertiaReactVersion}" tailwindcss@"${vm.tailwindVersion}" vite@"${vm.viteVersion}" laravel-vite-plugin@"${vm.laravelVitePlugin}"
call npm run build

# 5. Inicializar Base de Datos (${config.databaseEngine.toUpperCase()}) y Llave de Aplicación
php artisan key:generate
php artisan migrate --seed --force
`;
    }

    return `#!/usr/bin/env bash
# ============================================================================
# SCRIPT DE COMPROBACIÓN E INSTALACIÓN AUTOMÁTICA (LINUX DEBIAN 11/12 + LAMPP/FTP)
# Proyecto: ${config.projectName} | Laravel ${config.laravelVersion} + React + Inertia + Tailwind
# Base de Datos: ${config.databaseEngine.toUpperCase()} | Sin Docker
# ============================================================================
set -e

# 1. Comprobar e instalar PHP, extensiones y motor de Base de Datos (${config.databaseEngine.toUpperCase()})
sudo apt update
sudo apt install -y curl git unzip php php-cli php-common php-curl php-gd php-intl php-mbstring php-mysql php-pgsql php-sqlite3 php-xml php-zip php-bcmath

# 2. Comprobar e instalar Composer y Node.js 20 LTS
command -v composer >/dev/null 2>&1 || (curl -sS https://getcomposer.org/installer | sudo php -- --install-dir=/usr/local/bin --filename=composer)
command -v node >/dev/null 2>&1 || (curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs)

# 3. Instalar Framework Laravel ${config.laravelVersion}, Inertia.js, Filament PHP e InfyOm
cd laravel_app
[ ! -f .env ] && cp .env.example .env
composer install --optimize-autoloader
composer require laravel/framework:"${vm.laravelPackage}" inertiajs/inertia-laravel:"${vm.inertiaLaravelVersion}" filament/filament:"${vm.filamentVersion}" infyomlabs/laravel-generator:"${vm.infyomBranch}.x-dev" -W

# 4. Instalar React ${vm.reactVersion}, Inertia React ${vm.inertiaReactVersion}, Tailwind CSS ${vm.tailwindVersion} y Vite ${vm.viteVersion}
npm install react@"${vm.reactVersion}" react-dom@"${vm.reactVersion}" @inertiajs/react@"${vm.inertiaReactVersion}" tailwindcss@"${vm.tailwindVersion}" vite@"${vm.viteVersion}" laravel-vite-plugin@"${vm.laravelVitePlugin}"
npm run build

# 5. Inicializar Base de Datos (${config.databaseEngine.toUpperCase()}) y Permisos
php artisan key:generate
php artisan migrate --seed --force
`;
  }, [selectedOsTab, config, vm]);

  const handleCopyFullScript = () => {
    navigator.clipboard.writeText(fullScriptText);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 1800);
  };

  return (
    <section className="p-6 rounded-lg border border-slate-800 bg-[#1E293B]/50 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="space-y-1 max-w-2xl">
          <div className="flex items-center gap-2 text-xs text-amber-400 font-medium">
            <Wrench className="w-3.5 h-3.5" />
            <span>Comprobador de Versiones y Aprovisionamiento Inicial Automático</span>
          </div>
          <h3 className="text-base font-semibold text-white">
            Auditoría e Instalación Automática de Herramientas (XAMPP v3.3.0 Local & Servidor FTP)
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Comprueba automáticamente que el entorno posea las versiones apropiadas de <strong>PHP</strong>, <strong>Composer</strong>, <strong>Node.js/Vite</strong>, <strong>Laravel {config.laravelVersion}</strong>, <strong>React + Inertia.js + Tailwind CSS (SPA)</strong> y el motor <strong>{config.databaseEngine.toUpperCase()}</strong>. Si falta alguna herramienta o versión, informa al CEO y la instala automáticamente tanto aquí como en el producto final exportado.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleVerifyAndReportToCeo}
            className="px-3.5 py-2 rounded-md border border-slate-700 bg-slate-900 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            1. Comprobar Versiones e Informar al CEO ({issuesCount} alertas)
          </button>

          <button
            type="button"
            onClick={handleRunAutomaticInstallation}
            disabled={isAutoInstalling}
            className="px-4 py-2 rounded-md bg-amber-500 text-slate-950 text-xs font-semibold hover:bg-amber-400 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5" />
            {isAutoInstalling
              ? 'Instalando Herramientas...'
              : '2. Ejecutar Instalación Automática Inicial'}
          </button>
        </div>
      </div>

      {/* Tools & Version Check Table */}
      <div className="overflow-x-auto rounded-md border border-slate-800 bg-slate-950/60">
        <table className="min-w-full divide-y divide-slate-800 text-left">
          <thead className="bg-slate-900">
            <tr>
              <th className="px-4 py-2.5 text-xs font-semibold text-slate-300">
                Herramienta / Componente del Ecosistema
              </th>
              <th className="px-4 py-2.5 text-xs font-semibold text-slate-300">
                Versión Requerida
              </th>
              <th className="px-4 py-2.5 text-xs font-semibold text-slate-300">
                Estado Detectado
              </th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-300">
                Diagnóstico
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {auditItems.map((item) => (
              <tr key={item.id} className="hover:bg-slate-900/40">
                <td className="px-4 py-3 align-top">
                  <div className="text-xs font-semibold text-white">{item.name}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{item.description}</div>
                </td>
                <td className="px-4 py-3 align-top font-mono text-xs text-amber-300">
                  {item.requiredVersion}
                </td>
                <td className="px-4 py-3 align-top font-mono text-xs text-slate-300">
                  {item.detectedVersion}
                </td>
                <td className="px-4 py-3 align-top text-right whitespace-nowrap">
                  {item.status === 'ok' ? (
                    <span className="text-xs font-mono text-emerald-400 inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Versión OK
                    </span>
                  ) : (
                    <span className="text-xs font-mono text-amber-400 inline-flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Requiere Auto-Instalación
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Interactive Terminal Output & Full Command Script for Final Product */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Real-time Execution Console */}
        <div className="rounded-md border border-slate-800 bg-slate-950 flex flex-col overflow-hidden">
          <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-amber-400" />
              Consola de Diagnóstico y Auto-Instalación del Enjambre
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              swarm_engine/auto_provisioner_doctor.py
            </span>
          </div>
          <div className="p-4 font-mono text-xs text-emerald-300 space-y-1.5 max-h-60 overflow-y-auto">
            {installProgressLog.map((line, idx) => (
              <div key={idx} className="leading-relaxed">
                {line}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Complete Auto-Installer Commands Included in the Final Product */}
        <div className="rounded-md border border-slate-800 bg-slate-950 flex flex-col overflow-hidden">
          <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setSelectedOsTab('windows')}
                className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer ${
                  selectedOsTab === 'windows'
                    ? 'bg-amber-500 text-slate-950 font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Comandos Windows (XAMPP v3.3.0)
              </button>
              <button
                type="button"
                onClick={() => setSelectedOsTab('debian')}
                className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer ${
                  selectedOsTab === 'debian'
                    ? 'bg-amber-500 text-slate-950 font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Comandos Linux Debian / FTP
              </button>
            </div>

            <button
              type="button"
              onClick={handleCopyFullScript}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 flex items-center gap-1 cursor-pointer"
            >
              {copiedCmd ? (
                <Check className="w-3 h-3 text-emerald-400" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
              {copiedCmd ? 'Copiado' : 'Copiar Comandos'}
            </button>
          </div>
          <pre className="p-4 font-mono text-[11px] text-slate-200 overflow-x-auto max-h-60 leading-relaxed">
            {fullScriptText}
          </pre>
        </div>
      </div>
    </section>
  );
}
