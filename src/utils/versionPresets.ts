import { EcosystemVersionMatrix, FrameworkMigrationMode, LaravelVersion } from '../types/swarm';

export const ECOSYSTEM_VERSION_PRESETS: Record<LaravelVersion, EcosystemVersionMatrix> = {
  '9.x': {
    phpVersion: '^8.0.2 | ^8.1',
    laravelPackage: '^9.52',
    reactVersion: '^18.2.0',
    inertiaLaravelVersion: '^0.6.9',
    inertiaReactVersion: '^1.0.14',
    tailwindVersion: '^3.3.0',
    viteVersion: '^4.0.0',
    laravelVitePlugin: '^0.7.5',
    filamentVersion: '^2.17 | ^3.0-compat',
    infyomBranch: '9.0',
    middlewareArchitecture: 'http_kernel_classic',
  },
  '10.x': {
    phpVersion: '^8.1 | ^8.2',
    laravelPackage: '^10.48',
    reactVersion: '^18.3.1',
    inertiaLaravelVersion: '^1.0.0',
    inertiaReactVersion: '^1.2.0',
    tailwindVersion: '^3.4.10',
    viteVersion: '^5.0.0',
    laravelVitePlugin: '^1.0.0',
    filamentVersion: '^3.2',
    infyomBranch: '10.0',
    middlewareArchitecture: 'http_kernel_classic',
  },
  '11.x': {
    phpVersion: '^8.2 | ^8.3',
    laravelPackage: '^11.31',
    reactVersion: '^19.0.0',
    inertiaLaravelVersion: '^1.3.0',
    inertiaReactVersion: '^2.0.0',
    tailwindVersion: '^3.4.15',
    viteVersion: '^6.0.0',
    laravelVitePlugin: '^1.1.0',
    filamentVersion: '^3.2',
    infyomBranch: '11.0',
    middlewareArchitecture: 'bootstrap_app_modern',
  },
};

export interface MigrationTransformationItem {
  id: string;
  tool: string;
  fromLaravel9: string;
  toHigherVersion: string;
  impactDescription: string;
}

export function getMigrationTransformations(targetVersion: LaravelVersion): MigrationTransformationItem[] {
  if (targetVersion === '9.x') {
    return [
      {
        id: 't1',
        tool: 'Laravel Core & PHP (XAMPP v3.3.0)',
        fromLaravel9: 'laravel/framework ^9.52 (PHP ^8.0.2 | ^8.1)',
        toHigherVersion: 'Mantiene estructura nativa Laravel 9.x sin cambios invasivos',
        impactDescription: 'Compatible directamente con servidores legados y XAMPP v3.3.0 estándar.',
      },
      {
        id: 't2',
        tool: 'React + Inertia.js SPA',
        fromLaravel9: 'react ^18.2.0 + @inertiajs/react ^1.0.14',
        toHigherVersion: 'Sincronizado con inertiajs/inertia-laravel ^0.6.9',
        impactDescription: 'Navegación SPA completa con soporte de formularios useForm y SSR opcional.',
      },
      {
        id: 't3',
        tool: 'Tailwind CSS + Vite',
        fromLaravel9: 'tailwindcss ^3.3.0 + vite ^4.0.0 + laravel-vite-plugin ^0.7.5',
        toHigherVersion: 'Compilación rápida de assets SPA en public/build',
        impactDescription: 'Reemplaza Laravel Mix por Vite 4 manteniendo compatibilidad total con Laravel 9.',
      },
    ];
  }

  if (targetVersion === '10.x') {
    return [
      {
        id: 't1',
        tool: 'Laravel 9.x → Laravel 10.x LTS',
        fromLaravel9: 'laravel/framework ^9.52 (Sin return types estrictos)',
        toHigherVersion: 'laravel/framework ^10.48 (PHP ^8.1 | ^8.2 + Return Types Nativos)',
        impactDescription: 'Conserva app/Http/Kernel.php clásico pero añade tipado nativo en Migraciones, Middleware y Controladores.',
      },
      {
        id: 't2',
        tool: 'Inertia.js + React 18.3 SPA',
        fromLaravel9: 'inertiajs/inertia-laravel ^0.6.9',
        toHigherVersion: 'inertiajs/inertia-laravel ^1.0.0 + @inertiajs/react ^1.2.0',
        impactDescription: 'Actualiza el adaptador oficial de Inertia para soportar Laravel 10 sin romper ninguna vista React existente.',
      },
      {
        id: 't3',
        tool: 'Vite 5 + Tailwind CSS 3.4',
        fromLaravel9: 'vite ^4.0.0 + laravel-vite-plugin ^0.7.5',
        toHigherVersion: 'vite ^5.0.0 + laravel-vite-plugin ^1.0.0 + tailwindcss ^3.4.10',
        impactDescription: 'Actualiza el empaquetador ESM y optimiza la carga de módulos React en producción.',
      },
      {
        id: 't4',
        tool: 'Filament PHP + InfyOm + Craftable',
        fromLaravel9: 'Filament v2 / InfyOm 9.0',
        toHigherVersion: 'filament/filament ^3.2 + InfyOm 10.0 + Craftable PRO Adapter',
        impactDescription: 'Habilita todas las mejoras visuales de Filament v3 sobre la base estable de Laravel 10.',
      },
    ];
  }

  return [
    {
      id: 't1',
      tool: 'Laravel 9.x → Laravel 11.x (Arquitectura Moderna)',
      fromLaravel9: 'app/Http/Kernel.php +laravel/framework ^9.52',
      toHigherVersion: 'bootstrap/app.php (->withMiddleware) + laravel/framework ^11.31',
      impactDescription: 'El Agente de Seguridad migra automáticamente EnsureUserHasRole y HandleInertiaRequests desde Http/Kernel.php hacia bootstrap/app.php.',
    },
    {
      id: 't2',
      tool: 'React 19 + Inertia.js v2 SPA',
      fromLaravel9: 'react ^18.2.0 + @inertiajs/react ^1.0.14',
      toHigherVersion: 'react ^19.0.0 + @inertiajs/react ^2.0.0 + inertia-laravel ^1.3.0',
      impactDescription: 'Soporte de carga diferida (Deferred Props), Polling nativo y Prefetching en el Dashboard SPA.',
    },
    {
      id: 't3',
      tool: 'Vite 6 + Tailwind CSS',
      fromLaravel9: 'vite ^4.0.0 + laravel-vite-plugin ^0.7.5',
      toHigherVersion: 'vite ^6.0.0 + laravel-vite-plugin ^1.1.0 + tailwindcss ^3.4.15',
      impactDescription: 'Reconfigura vite.config.js para compilación instantánea sin Docker.',
    },
    {
      id: 't4',
      tool: 'Scaffolders: LaraFast + InfyOm + Filament PHP v3',
      fromLaravel9: 'InfyOm 9.0 + Filament v2/v3',
      toHigherVersion: 'InfyOm 11.0 + Filament PHP ^3.2 + Craftable PRO / Nova Bridge',
      impactDescription: 'Sincroniza todas las plantillas de generación visual y esquemas de base de datos con Laravel 11.',
    },
  ];
}

export function resolveMigrationMode(version: LaravelVersion, currentMode: FrameworkMigrationMode): FrameworkMigrationMode {
  if (version === '9.x') return 'keep_laravel_9';
  if (version === '10.x') return 'migrate_9_to_10';
  return currentMode === 'native_modern' ? 'native_modern' : 'migrate_9_to_11';
}
