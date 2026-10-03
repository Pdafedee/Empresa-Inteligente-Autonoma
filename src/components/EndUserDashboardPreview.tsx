import React, { useState, useMemo } from 'react';
import {
  LayoutDashboard,
  Search,
  Plus,
  Trash2,
  Edit3,
  Filter,
  Download,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Database,
  Code,
  Copy,
  Check,
  Eye,
  Sliders,
  Sparkles,
  Layers,
  BarChart3,
  TrendingUp,
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Table,
  Kanban,
  FileSpreadsheet,
  Building,
} from 'lucide-react';
import { CompanyConfig, CrudEntity, DashboardTheme } from '../types/swarm';

interface EndUserDashboardPreviewProps {
  config: CompanyConfig;
  entities: CrudEntity[];
  selectedEntity: CrudEntity;
  onSelectEntity: (entityId: string) => void;
  mockRows: Record<string, Array<Record<string, any>>>;
  onUpdateMockRows: (newRows: Record<string, Array<Record<string, any>>>) => void;
}

export default function EndUserDashboardPreview({
  config,
  entities,
  selectedEntity,
  onSelectEntity,
  mockRows,
  onUpdateMockRows,
}: EndUserDashboardPreviewProps) {
  const [activeTheme, setActiveTheme] = useState<DashboardTheme>(
    config.preferredDashboardTheme || 'filament_enterprise'
  );
  const [simulatedRole, setSimulatedRole] = useState<string>(config.authRoles[0] || 'admin');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 5;

  // View Mode for Craftable Theme (Table vs Kanban)
  const [craftableViewMode, setCraftableViewMode] = useState<'table' | 'kanban'>('table');

  // Modal State for New/Edit Record
  const [isRecordModalOpen, setIsRecordModalOpen] = useState<boolean>(false);
  const [editingRowId, setEditingRowId] = useState<number | string | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [modalFeedback, setModalFeedback] = useState<string | null>(null);

  // Inspector Drawer for Generated React + Inertia Code
  const [showCodeInspector, setShowCodeInspector] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Current entity rows
  const currentEntityRows = useMemo(() => {
    return mockRows[selectedEntity.id] || [];
  }, [mockRows, selectedEntity.id]);

  // Dynamic status options from rows or default
  const statusOptions = useMemo(() => {
    const statuses = new Set<string>();
    currentEntityRows.forEach((r) => {
      if (r.status) statuses.add(String(r.status));
      if (r.is_paid !== undefined) statuses.add(r.is_paid ? 'pagado' : 'pendiente');
    });
    return Array.from(statuses);
  }, [currentEntityRows]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return currentEntityRows.filter((row) => {
      // Search term filter
      const matchesSearch = !searchTerm
        ? true
        : Object.values(row)
            .join(' ')
            .toLowerCase()
            .includes(searchTerm.toLowerCase());

      // Status filter
      let matchesStatus = true;
      if (statusFilter !== 'all') {
        if (row.status !== undefined) {
          matchesStatus = String(row.status).toLowerCase() === statusFilter.toLowerCase();
        } else if (row.is_paid !== undefined) {
          const rowPayStr = row.is_paid ? 'pagado' : 'pendiente';
          matchesStatus = rowPayStr === statusFilter.toLowerCase();
        }
      }

      return matchesSearch && matchesStatus;
    });
  }, [currentEntityRows, searchTerm, statusFilter]);

  // Paginated rows
  const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  // KPI Calculations
  const kpiStats = useMemo(() => {
    const total = currentEntityRows.length;
    let numericSum = 0;
    let numericFieldName = '';

    // Find first numeric field to aggregate
    const numericField = selectedEntity.fields.find(
      (f) => f.type === 'decimal' || f.type === 'integer'
    );
    if (numericField) {
      numericFieldName = numericField.label;
      numericSum = currentEntityRows.reduce((acc, r) => {
        const val = Number(r[numericField.name]) || 0;
        return acc + val;
      }, 0);
    }

    const activeCount = currentEntityRows.filter((r) => {
      if (r.status) return String(r.status).toLowerCase() === 'activo';
      if (r.is_paid !== undefined) return Boolean(r.is_paid);
      return true;
    }).length;

    return {
      total,
      numericSum,
      numericFieldName,
      activeCount,
      complianceRate: total > 0 ? Math.round((activeCount / total) * 100) : 100,
    };
  }, [currentEntityRows, selectedEntity]);

  // RBAC permissions check for current simulated role
  const permissions = useMemo(() => {
    const isAdmin = simulatedRole === 'admin';
    const isEditor = simulatedRole === 'editor';
    const isAuditor = simulatedRole === 'auditor';
    const isOperador = simulatedRole === 'operador';

    return {
      canCreate: isAdmin || isEditor,
      canEdit: isAdmin || isEditor,
      canDelete: isAdmin,
      canExport: isAdmin || isEditor || isAuditor,
      roleDescription: isAdmin
        ? 'Control Total: Crear, Modificar, Borrar y Exportar'
        : isEditor
        ? 'Escritura & Edición: Crear y Modificar (Borrado restringido)'
        : isAuditor
        ? 'Auditoría & Inspección: Solo Lectura y Exportación'
        : 'Operaciones: Carga de Datos y Consulta Básica',
    };
  }, [simulatedRole]);

  // Open Create Record Modal
  const handleOpenCreate = () => {
    if (!permissions.canCreate) return;
    setEditingRowId(null);
    const initialForm: Record<string, any> = {};
    selectedEntity.fields.forEach((f) => {
      initialForm[f.name] =
        f.type === 'boolean'
          ? false
          : f.type === 'decimal' || f.type === 'integer'
          ? 0
          : f.type === 'date'
          ? new Date().toISOString().split('T')[0]
          : '';
    });
    setFormData(initialForm);
    setModalFeedback(null);
    setIsRecordModalOpen(true);
  };

  // Open Edit Record Modal
  const handleOpenEdit = (row: Record<string, any>) => {
    if (!permissions.canEdit) return;
    setEditingRowId(row.id || row[selectedEntity.primaryKey]);
    setFormData({ ...row });
    setModalFeedback(null);
    setIsRecordModalOpen(true);
  };

  // Save Record
  const handleSaveRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRowId !== null) {
      // Update
      const updated = currentEntityRows.map((r) =>
        (r.id || r[selectedEntity.primaryKey]) === editingRowId ? { ...formData } : r
      );
      onUpdateMockRows({ ...mockRows, [selectedEntity.id]: updated });
    } else {
      // Create new
      const newId = Date.now() % 10000;
      const newRow = {
        ...formData,
        id: newId,
        [selectedEntity.primaryKey]: newId,
      };
      onUpdateMockRows({
        ...mockRows,
        [selectedEntity.id]: [newRow, ...currentEntityRows],
      });
    }
    setIsRecordModalOpen(false);
  };

  // Delete Record
  const handleDeleteRecord = (rowId: any) => {
    if (!permissions.canDelete) return;
    const updated = currentEntityRows.filter(
      (r) => (r.id || r[selectedEntity.primaryKey]) !== rowId
    );
    onUpdateMockRows({ ...mockRows, [selectedEntity.id]: updated });
  };

  // Export filtered rows to CSV
  const handleExportCsv = () => {
    if (filteredRows.length === 0) return;
    const headers = selectedEntity.fields.map((f) => f.name).join(',');
    const rows = filteredRows.map((r) =>
      selectedEntity.fields.map((f) => `"${String(r[f.name] ?? '')}"`).join(',')
    );
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedEntity.tableName}_export_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Copy Generated React Code
  const handleCopyCode = () => {
    navigator.clipboard.writeText(sampleGeneratedCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Sample React + Inertia Code for this exact view
  const sampleGeneratedCode = useMemo(() => {
    return `// Archivo: resources/js/Pages/${selectedEntity.name}/Index.tsx
// Generado automáticamente por Valeria Thorne (Arquitecta Frontend SPA & Inertia.js)
// Stack: Laravel 9/10/11 MVC + React + Inertia.js + Tailwind CSS
// Tema Activo: ${activeTheme.toUpperCase()}

import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

interface Props {
  auth: { user: { name: string; role: string } };
  ${selectedEntity.pluralName.toLowerCase()}: Array<Record<string, any>>;
  metrics: { total: number; activeCount: number };
}

export default function ${selectedEntity.name}Index({ auth, ${selectedEntity.pluralName.toLowerCase()}, metrics }: Props) {
  const [search, setSearch] = useState('');
  const canDelete = auth.user.role === 'admin';
  const canCreate = auth.user.role === 'admin' || auth.user.role === 'editor';

  return (
    <AuthenticatedLayout
      user={auth.user}
      header={<h2 className="font-semibold text-xl text-slate-800 dark:text-slate-100">${selectedEntity.pluralName}</h2>}
    >
      <Head title="${selectedEntity.pluralName} — Dashboard" />

      <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-500">Total ${selectedEntity.pluralName}</span>
            <div className="text-2xl font-bold font-mono tabular-nums">{metrics.total}</div>
          </div>
          <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-500">Registros Activos</span>
            <div className="text-2xl font-bold font-mono tabular-nums text-emerald-500">{metrics.activeCount}</div>
          </div>
          <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-500">Rol Activo en Sesión</span>
            <div className="text-sm font-semibold capitalize">{auth.user.role}</div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-950">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">PK (${selectedEntity.primaryKey})</th>
                ${selectedEntity.fields.map((f) => `<th className="px-4 py-3 text-left text-xs font-medium text-slate-500">${f.label}</th>`).join('\n                ')}
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {${selectedEntity.pluralName.toLowerCase()}.map((item) => (
                <tr key={item.${selectedEntity.primaryKey}} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 text-xs font-mono tabular-nums">#{item.${selectedEntity.primaryKey}}</td>
                  ${selectedEntity.fields.map((f) => `<td className="px-4 py-3 text-xs font-mono tabular-nums">{String(item.${f.name} ?? '-')}</td>`).join('\n                  ')}
                  <td className="px-4 py-3 text-right space-x-2">
                    {canDelete && (
                      <button
                        onClick={() => router.delete(route('${selectedEntity.name.toLowerCase()}s.destroy', item.${selectedEntity.primaryKey}))}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Eliminar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}`;
  }, [selectedEntity, activeTheme]);

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0B0F19] text-slate-100 overflow-hidden shadow-2xl flex flex-col">
      {/* 1. TOP CONTROL BAR: THEME SWITCHER + RBAC SIMULATOR + CODE INSPECTOR */}
      <div className="px-6 py-4 bg-[#0F172A] border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        {/* Left: Section Header & Active Employee Badge */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <LayoutDashboard className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-tight">
                Suite de Interfaces Visuales para el Usuario Final
              </h2>
              <span className="text-[11px] font-medium text-amber-400 border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 rounded">
                Valeria Thorne · Agente 08
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Laravel MVC + React 18/19 + Inertia.js + Tailwind CSS sobre SPA con 3 Diseños de Dashboard
            </p>
          </div>
        </div>

        {/* Right Controls: 3 Themes + Role Simulator + Code Inspector */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Theme Selector (Segmented Button Group) */}
          <div className="flex items-center p-1 bg-slate-900 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTheme('filament_enterprise')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTheme === 'filament_enterprise'
                  ? 'bg-amber-500 text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              Filament Enterprise v3
            </button>
            <button
              onClick={() => setActiveTheme('larafast_saas')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTheme === 'larafast_saas'
                  ? 'bg-amber-500 text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              LaraFast Modern SaaS
            </button>
            <button
              onClick={() => setActiveTheme('craftable_pro')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTheme === 'craftable_pro'
                  ? 'bg-amber-500 text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Craftable PRO Executive
            </button>
          </div>

          {/* Role Simulator */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 rounded-lg border border-slate-800">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-400">Rol:</span>
            <select
              value={simulatedRole}
              onChange={(e) => setSimulatedRole(e.target.value)}
              className="bg-transparent text-xs font-semibold text-amber-400 focus:outline-none cursor-pointer"
            >
              {config.authRoles.map((r) => (
                <option key={r} value={r} className="bg-slate-900 text-white">
                  {r.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Code Inspector Toggle */}
          <button
            onClick={() => setShowCodeInspector(!showCodeInspector)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              showCodeInspector
                ? 'bg-slate-800 text-white border-slate-700'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
            }`}
          >
            <Code className="w-3.5 h-3.5 text-amber-400" />
            Ver Código React
          </button>
        </div>
      </div>

      {/* 2. OPTIONAL CODE DRAWER (COLLAPSIBLE) */}
      {showCodeInspector && (
        <div className="p-4 bg-slate-950 border-b border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <span className="text-amber-400">resources/js/Pages/{selectedEntity.name}/Index.tsx</span>
              <span>·</span>
              <span>Componente React SPA + Inertia.js listo para producción</span>
            </div>
            <button
              onClick={handleCopyCode}
              className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 flex items-center gap-1 cursor-pointer"
            >
              {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              {copiedCode ? 'Copiado al portapapeles' : 'Copiar Código'}
            </button>
          </div>
          <pre className="p-4 rounded bg-slate-900/90 text-xs font-mono text-slate-200 overflow-x-auto max-h-60 leading-relaxed border border-slate-800">
            {sampleGeneratedCode}
          </pre>
        </div>
      )}

      {/* 3. SIMULATED BROWSER / SPA WORKSPACE VIEWPORT */}
      <div className="flex flex-col lg:flex-row flex-1 min-h-[620px]">
        {/* SIDEBAR NAVIGATION (ADAPTS ACCORDING TO ACTIVE THEME) */}
        <div
          className={`w-full lg:w-64 p-4 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col justify-between gap-6 ${
            activeTheme === 'filament_enterprise'
              ? 'bg-[#0F172A]'
              : activeTheme === 'larafast_saas'
              ? 'bg-[#0E131F]'
              : 'bg-[#131B2E]'
          }`}
        >
          <div className="space-y-6">
            {/* System Title & Project Context */}
            <div className="space-y-1 pb-3 border-b border-slate-800/80">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                {activeTheme === 'filament_enterprise'
                  ? 'Filament Panel v3'
                  : activeTheme === 'larafast_saas'
                  ? 'LaraFast App Core'
                  : 'Craftable App Shell'}
              </span>
              <h3 className="text-sm font-bold text-white truncate">{config.projectName}</h3>
              <div className="text-xs text-slate-400 font-mono">
                {config.databaseEngine.toUpperCase()} · Laravel {config.laravelVersion}
              </div>
            </div>

            {/* Entity Navigation Links */}
            <div className="space-y-1">
              <div className="px-2 pb-1.5 text-xs font-semibold text-slate-400 flex items-center justify-between">
                <span>Módulos del Sistema</span>
                <span className="text-[10px] font-mono tabular-nums text-slate-400">
                  {entities.length} CRUDs
                </span>
              </div>
              {entities.map((entity) => {
                const isSelected = selectedEntity.id === entity.id;
                const rowCount = (mockRows[entity.id] || []).length;
                return (
                  <button
                    key={entity.id}
                    onClick={() => onSelectEntity(entity.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer text-left ${
                      isSelected
                        ? activeTheme === 'filament_enterprise'
                          ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                          : activeTheme === 'larafast_saas'
                          ? 'bg-indigo-600 text-white font-semibold shadow-md'
                          : 'bg-emerald-600 text-white font-semibold shadow-md'
                        : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                    }`}
                  >
                    <span className="truncate">{entity.pluralName}</span>
                    <span
                      className={`text-[10px] font-mono tabular-nums px-1.5 py-0.5 rounded ${
                        isSelected
                          ? 'bg-black/20 text-current'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {rowCount}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Preserved Queries Section if available */}
            {selectedEntity.customQueries && selectedEntity.customQueries.length > 0 && (
              <div className="pt-3 border-t border-slate-800/80 space-y-2">
                <div className="px-2 text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                  <Database className="w-3 h-3" />
                  <span>Consultas SQL Preservadas</span>
                </div>
                <div className="space-y-1">
                  {selectedEntity.customQueries.map((q) => (
                    <div
                      key={q.id}
                      className="px-2.5 py-2 rounded bg-slate-900/80 border border-slate-800/80 text-[11px] font-mono text-slate-300 space-y-1"
                    >
                      <div className="text-amber-300 font-semibold">{q.name}</div>
                      <div className="text-[10px] text-slate-400 line-clamp-2">{q.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Session Box with Role Permissions Info */}
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1 text-xs">
            <div className="text-slate-400">Usuario en Sesión</div>
            <div className="font-semibold text-white truncate">{config.ceoName}</div>
            <div className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Rol: {simulatedRole.toUpperCase()}</span>
            </div>
            <div className="text-[10px] text-slate-400 pt-1 leading-snug">
              {permissions.roleDescription}
            </div>
          </div>
        </div>

        {/* MAIN DASHBOARD CONTENT AREA */}
        <div className="flex-1 p-6 space-y-6 overflow-x-hidden">
          {/* HEADER BAR OF THE CURRENT ENTITY */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>{config.projectName}</span>
                <span>/</span>
                <span className="text-amber-400 font-semibold">{selectedEntity.pluralName}</span>
                <span>/</span>
                <span>Tabla: {selectedEntity.tableName}</span>
              </div>
              <h1 className="text-xl font-bold text-white mt-1">
                Gestión Integral de {selectedEntity.pluralName}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">{selectedEntity.description}</p>
            </div>

            {/* Actions: Export + New Record */}
            <div className="flex items-center gap-2">
              {activeTheme === 'craftable_pro' && (
                <div className="flex items-center p-1 bg-slate-900 rounded border border-slate-800 mr-2">
                  <button
                    onClick={() => setCraftableViewMode('table')}
                    className={`p-1.5 rounded text-xs cursor-pointer ${
                      craftableViewMode === 'table' ? 'bg-slate-800 text-white' : 'text-slate-400'
                    }`}
                    title="Vista Tabla"
                  >
                    <Table className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setCraftableViewMode('kanban')}
                    className={`p-1.5 rounded text-xs cursor-pointer ${
                      craftableViewMode === 'kanban' ? 'bg-slate-800 text-white' : 'text-slate-400'
                    }`}
                    title="Vista Tablero Kanban"
                  >
                    <Kanban className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {permissions.canExport && (
                <button
                  onClick={handleExportCsv}
                  className="px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Exportar CSV
                </button>
              )}

              {permissions.canCreate ? (
                <button
                  onClick={handleOpenCreate}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md ${
                    activeTheme === 'filament_enterprise'
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                      : activeTheme === 'larafast_saas'
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Nuevo {selectedEntity.name}
                </button>
              ) : (
                <div className="text-xs text-slate-400 px-3 py-2 rounded bg-slate-900 border border-slate-800 font-mono">
                  Solo Lectura ({simulatedRole})
                </div>
              )}
            </div>
          </div>

          {/* DYNAMIC KPI SUMMARY STAT CARDS (ZERO-PILL DISCIPLINE) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 space-y-1">
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>Registros Totales</span>
                <Database className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-white">
                {kpiStats.total}
              </div>
              <div className="text-[11px] text-slate-400">
                PK: <span className="font-mono text-slate-300">{selectedEntity.primaryKey}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 space-y-1">
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>Activos / En Regla</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-emerald-400">
                {kpiStats.activeCount}
              </div>
              <div className="text-[11px] text-slate-400">
                Tasa de Cumplimiento: <span className="font-mono text-slate-300">{kpiStats.complianceRate}%</span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 space-y-1">
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>{kpiStats.numericFieldName || 'Volumen Estimado'}</span>
                <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-indigo-300">
                {kpiStats.numericSum.toLocaleString('es-ES', { minimumFractionDigits: 1 })}
              </div>
              <div className="text-[11px] text-slate-400">Total acumulado en registros</div>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 space-y-1">
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>Permisos Asignados</span>
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-base font-bold text-amber-400 capitalize">
                {simulatedRole}
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                {permissions.canDelete ? 'Acceso Administrativo Completo' : 'Acceso Restringido'}
              </div>
            </div>
          </div>

          {/* SEARCH, STATUS FILTER AND TOOLS BAR */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-lg bg-slate-900/80 border border-slate-800">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={`Buscar en ${selectedEntity.pluralName} por cualquier columna...`}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
              />
            </div>

            {/* Status Filter Segmented Controls */}
            {statusOptions.length > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-xs text-slate-400 mr-1 flex items-center gap-1">
                  <Filter className="w-3 h-3" /> Estado:
                </span>
                <button
                  onClick={() => {
                    setStatusFilter('all');
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-1 rounded text-xs font-mono transition-colors cursor-pointer ${
                    statusFilter === 'all'
                      ? 'bg-amber-500 text-slate-950 font-semibold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  Todos ({currentEntityRows.length})
                </button>
                {statusOptions.map((st) => (
                  <button
                    key={st}
                    onClick={() => {
                      setStatusFilter(st);
                      setCurrentPage(1);
                    }}
                    className={`px-2.5 py-1 rounded text-xs font-mono capitalize transition-colors cursor-pointer ${
                      statusFilter === st
                        ? 'bg-amber-500 text-slate-950 font-semibold'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            )}

            <div className="text-xs font-mono tabular-nums text-slate-400">
              Mostrando {filteredRows.length} de {currentEntityRows.length}
            </div>
          </div>

          {/* VIEW SWITCH: TABLE OR KANBAN (FOR CRAFTABLE) */}
          {activeTheme === 'craftable_pro' && craftableViewMode === 'kanban' ? (
            /* KANBAN BOARD VIEW */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['activo', 'revision', 'inactivo'].map((colStatus) => {
                const colRows = filteredRows.filter((r) => {
                  const s = String(r.status || (r.is_paid ? 'activo' : 'revision')).toLowerCase();
                  return s === colStatus || (colStatus === 'activo' && s === 'pagado');
                });
                return (
                  <div key={colStatus} className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <span className="text-xs font-semibold text-slate-200 capitalize">
                        {colStatus === 'activo' ? '✓ Activos / Pagados' : colStatus === 'revision' ? '⏳ En Revisión / Pendiente' : '⨯ Inactivos'}
                      </span>
                      <span className="text-xs font-mono tabular-nums text-slate-400">{colRows.length}</span>
                    </div>
                    <div className="space-y-2.5 min-h-[160px]">
                      {colRows.length === 0 ? (
                        <div className="text-xs text-slate-500 italic py-6 text-center">Sin registros en este estado</div>
                      ) : (
                        colRows.map((row) => (
                          <div
                            key={row.id || row[selectedEntity.primaryKey]}
                            className="p-3 rounded-lg border border-slate-800 bg-slate-950/80 space-y-2 hover:border-slate-700 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-mono text-amber-400">#{row.id || row[selectedEntity.primaryKey]}</span>
                              <div className="flex items-center gap-1.5">
                                {permissions.canEdit && (
                                  <button
                                    onClick={() => handleOpenEdit(row)}
                                    className="text-slate-400 hover:text-white cursor-pointer"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                {permissions.canDelete && (
                                  <button
                                    onClick={() => handleDeleteRecord(row.id || row[selectedEntity.primaryKey])}
                                    className="text-red-400 hover:text-red-300 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                            {selectedEntity.fields.slice(0, 3).map((f) => (
                              <div key={f.id} className="text-xs">
                                <span className="text-slate-400">{f.label}: </span>
                                <span className="font-mono text-slate-200">{String(row[f.name] ?? '-')}</span>
                              </div>
                            ))}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* HIGH-DENSITY DATA TABLE */
            <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-800 text-left">
                  <thead className="bg-slate-900/90">
                    <tr>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-300">
                        PK ({selectedEntity.primaryKey})
                      </th>
                      {selectedEntity.fields.map((f) => (
                        <th key={f.id} className="px-4 py-3 text-xs font-semibold text-slate-300">
                          {f.label}
                        </th>
                      ))}
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-300">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {paginatedRows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={selectedEntity.fields.length + 2}
                          className="px-4 py-12 text-center text-xs text-slate-400"
                        >
                          No se encontraron registros que coincidan con la búsqueda o filtro.
                        </td>
                      </tr>
                    ) : (
                      paginatedRows.map((row) => {
                        const rowKey = row.id || row[selectedEntity.primaryKey];
                        return (
                          <tr key={rowKey} className="hover:bg-slate-900/50 transition-colors">
                            <td className="px-4 py-3 text-xs font-mono tabular-nums text-amber-400 font-semibold">
                              #{rowKey}
                            </td>
                            {selectedEntity.fields.map((f) => {
                              const val = row[f.name];
                              const isBool = f.type === 'boolean';
                              const isNumeric = f.type === 'decimal' || f.type === 'integer';

                              return (
                                <td
                                  key={f.id}
                                  className={`px-4 py-3 text-xs font-mono tabular-nums ${
                                    isNumeric ? 'text-slate-100 font-semibold' : 'text-slate-300'
                                  }`}
                                >
                                  {isBool ? (
                                    val ? (
                                      <span className="text-emerald-400 font-semibold">✓ Sí</span>
                                    ) : (
                                      <span className="text-slate-500">⨯ No</span>
                                    )
                                  ) : (
                                    String(val ?? '-')
                                  )}
                                </td>
                              );
                            })}
                            <td className="px-4 py-3 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-2">
                                {permissions.canEdit && (
                                  <button
                                    onClick={() => handleOpenEdit(row)}
                                    className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
                                    title="Editar Registro"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                {permissions.canDelete ? (
                                  <button
                                    onClick={() => handleDeleteRecord(rowKey)}
                                    className="p-1 rounded hover:bg-red-950/40 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                                    title="Eliminar Registro (Admin)"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                ) : (
                                  <span className="text-[11px] text-slate-500">Protegido</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION BAR */}
              <div className="px-4 py-3 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span className="tabular-nums">
                  Página {currentPage} de {totalPages} ({filteredRows.length} registros)
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded border border-slate-800 bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 text-slate-300 cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className="p-1.5 rounded border border-slate-800 bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 text-slate-300 cursor-pointer"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-700 bg-slate-900 text-slate-100 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-400" />
                {editingRowId !== null
                  ? `Editar ${selectedEntity.name} #${editingRowId}`
                  : `Crear Nuevo ${selectedEntity.name}`}
              </h3>
              <button
                onClick={() => setIsRecordModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRecord} className="space-y-4">
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {selectedEntity.fields.map((field) => (
                  <div key={field.id} className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-300">
                      {field.label}{' '}
                      {field.required && <span className="text-amber-400">*</span>}
                    </label>

                    {field.type === 'boolean' ? (
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="checkbox"
                          checked={Boolean(formData[field.name])}
                          onChange={(e) =>
                            setFormData({ ...formData, [field.name]: e.target.checked })
                          }
                          className="rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-0 cursor-pointer w-4 h-4"
                        />
                        <span className="text-xs text-slate-300">
                          {formData[field.name] ? 'Habilitado / Marcado' : 'Deshabilitado'}
                        </span>
                      </div>
                    ) : field.type === 'decimal' || field.type === 'integer' ? (
                      <input
                        type="number"
                        step={field.type === 'decimal' ? '0.01' : '1'}
                        value={formData[field.name] ?? ''}
                        onChange={(e) =>
                          setFormData({ ...formData, [field.name]: Number(e.target.value) })
                        }
                        required={field.required}
                        className="w-full rounded bg-slate-950 border border-slate-700 px-3 py-1.5 text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
                      />
                    ) : field.type === 'date' ? (
                      <input
                        type="date"
                        value={formData[field.name] ?? ''}
                        onChange={(e) =>
                          setFormData({ ...formData, [field.name]: e.target.value })
                        }
                        required={field.required}
                        className="w-full rounded bg-slate-950 border border-slate-700 px-3 py-1.5 text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
                      />
                    ) : field.type === 'text' ? (
                      <textarea
                        rows={3}
                        value={formData[field.name] ?? ''}
                        onChange={(e) =>
                          setFormData({ ...formData, [field.name]: e.target.value })
                        }
                        required={field.required}
                        className="w-full rounded bg-slate-950 border border-slate-700 px-3 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                      />
                    ) : (
                      <input
                        type="text"
                        value={formData[field.name] ?? ''}
                        onChange={(e) =>
                          setFormData({ ...formData, [field.name]: e.target.value })
                        }
                        required={field.required}
                        className="w-full rounded bg-slate-950 border border-slate-700 px-3 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                      />
                    )}
                  </div>
                ))}
              </div>

              {modalFeedback && (
                <div className="p-2.5 rounded bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-200">
                  {modalFeedback}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                  className="px-4 py-2 rounded text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded text-xs font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 cursor-pointer"
                >
                  {editingRowId !== null ? 'Guardar Cambios' : 'Crear Registro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
