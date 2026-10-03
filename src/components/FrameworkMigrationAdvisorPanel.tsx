import React, { useState } from 'react';
import { GitBranch, CheckCircle2, Layers, ArrowRightLeft, ShieldAlert } from 'lucide-react';
import {
  CompanyConfig,
  EcosystemVersionMatrix,
  LaravelVersion,
} from '../types/swarm';
import {
  ECOSYSTEM_VERSION_PRESETS,
  getMigrationTransformations,
  resolveMigrationMode,
} from '../utils/versionPresets';

interface Props {
  config: CompanyConfig;
  setConfig: React.Dispatch<React.SetStateAction<CompanyConfig>>;
  onCeoVersionDecision: (version: LaravelVersion, summary: string) => void;
}

export default function FrameworkMigrationAdvisorPanel({
  config,
  setConfig,
  onCeoVersionDecision,
}: Props) {
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  const handleSelectVersionPreset = (targetVersion: LaravelVersion) => {
    const presetMatrix: EcosystemVersionMatrix = {
      ...ECOSYSTEM_VERSION_PRESETS[targetVersion],
    };
    const mode = resolveMigrationMode(targetVersion, config.migrationMode);

    setConfig((prev) => ({
      ...prev,
      laravelVersion: targetVersion,
      migrationMode: mode,
      versionMatrix: presetMatrix,
    }));

    const summary =
      targetVersion === '9.x'
        ? `El CEO determinó mantener el proyecto en Laravel 9.x Clásico (${presetMatrix.laravelPackage}) con React ${presetMatrix.reactVersion}, Inertia.js ${presetMatrix.inertiaReactVersion}, Tailwind CSS ${presetMatrix.tailwindVersion} y Vite ${presetMatrix.viteVersion}.`
        : `El CEO autorizó la migración transparente e integrada de Laravel 9 hacia Laravel ${targetVersion} (${presetMatrix.laravelPackage}), sincronizando automáticamente React (${presetMatrix.reactVersion}), Inertia.js (${presetMatrix.inertiaReactVersion}), Tailwind CSS (${presetMatrix.tailwindVersion}), Vite (${presetMatrix.viteVersion}) y Filament PHP (${presetMatrix.filamentVersion}).`;

    setStatusBanner(summary);
    onCeoVersionDecision(targetVersion, summary);
  };

  const handleMatrixFieldChange = (
    key: keyof EcosystemVersionMatrix,
    value: string
  ) => {
    setConfig((prev) => ({
      ...prev,
      versionMatrix: {
        ...prev.versionMatrix,
        [key]: value,
      },
    }));
  };

  const transformations = getMigrationTransformations(config.laravelVersion);

  return (
    <section className="p-6 rounded-lg border border-slate-800 bg-[#1E293B]/50 space-y-6">
      {/* Header & Strategic Selector for the CEO */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="space-y-1 max-w-2xl">
          <div className="flex items-center gap-2 text-xs text-amber-400 font-medium">
            <GitBranch className="w-3.5 h-3.5" />
            <span>Gobernanza Tecnológica Transparente para el CEO / Usuario</span>
          </div>
          <h3 className="text-base font-semibold text-white">
            Decisión Ejecutiva: Mantener Laravel 9.x o Migrar Transparentemente a Laravel 10.x / 11.x
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Elija la versión principal de Laravel para su proyecto. El enjambre sincroniza automáticamente las versiones compatibles de <strong>React</strong>, <strong>Inertia.js (SPA)</strong>, <strong>Tailwind CSS</strong>, <strong>Vite</strong>, <strong>Filament PHP</strong>, <strong>Craftable PRO</strong>, <strong>LaraFast</strong> e <strong>InfyOm</strong> en <code>composer.json</code>, <code>package.json</code> y <code>vite.config.js</code>.
          </p>
        </div>

        {/* 3-Button Version & Migration Selector */}
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-950 rounded-md border border-slate-800 shrink-0">
          {(
            [
              {
                ver: '9.x',
                title: 'Laravel 9.x (Base Clásica)',
                sub: 'React 18.2 · Vite 4 · Kernel Clásico',
              },
              {
                ver: '10.x',
                title: 'Migrar / Crear en Laravel 10.x LTS',
                sub: 'React 18.3 · Vite 5 · Filament v3',
              },
              {
                ver: '11.x',
                title: 'Migrar / Crear en Laravel 11.x',
                sub: 'React 19 · Inertia 2 · Vite 6',
              },
            ] as Array<{ ver: LaravelVersion; title: string; sub: string }>
          ).map((opt) => {
            const isSelected = config.laravelVersion === opt.ver;
            return (
              <button
                key={opt.ver}
                type="button"
                onClick={() => handleSelectVersionPreset(opt.ver)}
                className={`px-3.5 py-2 rounded text-left transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <div className="text-xs font-semibold whitespace-nowrap">{opt.title}</div>
                <div
                  className={`text-[11px] font-mono whitespace-nowrap ${
                    isSelected ? 'text-slate-900 font-medium' : 'text-slate-400'
                  }`}
                >
                  {opt.sub}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {statusBanner && (
        <div className="p-3.5 rounded-md border border-emerald-500/40 bg-emerald-950/30 text-emerald-200 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{statusBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusBanner(null)}
            className="text-xs underline hover:text-white shrink-0"
          >
            Ocultar
          </button>
        </div>
      )}

      {/* Synchronized Ecosystem Version Matrix (Editable by CEO if desired) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              Matriz de Versiones Sincronizadas (SPA + Scaffolders)
            </h4>
            <span className="text-xs font-mono text-amber-400">
              Perfil Activo: Laravel {config.laravelVersion}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-md border border-slate-800 bg-slate-950/70">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">PHP (XAMPP / Debian)</label>
              <input
                type="text"
                value={config.versionMatrix.phpVersion}
                onChange={(e) => handleMatrixFieldChange('phpVersion', e.target.value)}
                className="w-full rounded bg-slate-900 border border-slate-800 px-2.5 py-1 text-xs font-mono text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">laravel/framework</label>
              <input
                type="text"
                value={config.versionMatrix.laravelPackage}
                onChange={(e) => handleMatrixFieldChange('laravelPackage', e.target.value)}
                className="w-full rounded bg-slate-900 border border-slate-800 px-2.5 py-1 text-xs font-mono text-amber-300"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">React & React-DOM</label>
              <input
                type="text"
                value={config.versionMatrix.reactVersion}
                onChange={(e) => handleMatrixFieldChange('reactVersion', e.target.value)}
                className="w-full rounded bg-slate-900 border border-slate-800 px-2.5 py-1 text-xs font-mono text-sky-300"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">@inertiajs/react (SPA)</label>
              <input
                type="text"
                value={config.versionMatrix.inertiaReactVersion}
                onChange={(e) => handleMatrixFieldChange('inertiaReactVersion', e.target.value)}
                className="w-full rounded bg-slate-900 border border-slate-800 px-2.5 py-1 text-xs font-mono text-emerald-300"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">inertia-laravel (Server)</label>
              <input
                type="text"
                value={config.versionMatrix.inertiaLaravelVersion}
                onChange={(e) => handleMatrixFieldChange('inertiaLaravelVersion', e.target.value)}
                className="w-full rounded bg-slate-900 border border-slate-800 px-2.5 py-1 text-xs font-mono text-emerald-300"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Tailwind CSS</label>
              <input
                type="text"
                value={config.versionMatrix.tailwindVersion}
                onChange={(e) => handleMatrixFieldChange('tailwindVersion', e.target.value)}
                className="w-full rounded bg-slate-900 border border-slate-800 px-2.5 py-1 text-xs font-mono text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Vite Bundler</label>
              <input
                type="text"
                value={config.versionMatrix.viteVersion}
                onChange={(e) => handleMatrixFieldChange('viteVersion', e.target.value)}
                className="w-full rounded bg-slate-900 border border-slate-800 px-2.5 py-1 text-xs font-mono text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Filament PHP / Craftable</label>
              <input
                type="text"
                value={config.versionMatrix.filamentVersion}
                onChange={(e) => handleMatrixFieldChange('filamentVersion', e.target.value)}
                className="w-full rounded bg-slate-900 border border-slate-800 px-2.5 py-1 text-xs font-mono text-amber-300"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Arquitectura Middleware</label>
              <select
                value={config.versionMatrix.middlewareArchitecture}
                onChange={(e) =>
                  handleMatrixFieldChange(
                    'middlewareArchitecture',
                    e.target.value as EcosystemVersionMatrix['middlewareArchitecture']
                  )
                }
                className="w-full rounded bg-slate-900 border border-slate-800 px-2 py-1 text-xs font-mono text-white"
              >
                <option value="http_kernel_classic">app/Http/Kernel.php (L9/L10)</option>
                <option value="bootstrap_app_modern">bootstrap/app.php (L11+)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right: Transparent Migration Bridge Impact Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <ArrowRightLeft className="w-3.5 h-3.5 text-amber-400" />
              Puente de Integración y Migración Transparente (Laravel 9 ↔ {config.laravelVersion})
            </h4>
            <span className="text-xs text-slate-400">0 Conflictos de Dependencias</span>
          </div>

          <div className="rounded-md border border-slate-800 bg-slate-950/70 divide-y divide-slate-800/80">
            {transformations.map((item) => (
              <div key={item.id} className="p-3 space-y-1 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-white">{item.tool}</span>
                  <span className="font-mono text-[11px] text-amber-300">
                    {item.toHigherVersion}
                  </span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  {item.impactDescription}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
