import React, { useState, useMemo } from 'react';
import {
  Play,
  Download,
  Database,
  ShieldCheck,
  Terminal,
  BookOpen,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Send,
  Copy,
  Check,
  Server,
  Sparkles,
  RefreshCw,
  FileCode,
  Sliders,
  Eye,
} from 'lucide-react';
import {
  AgentEmployee,
  AgentId,
  CompanyConfig,
  CrudEntity,
  DatabaseEngine,
  FieldDefinition,
  LaravelVersion,
  NotificationChannel,
  SwarmLogMessage,
} from './types/swarm';
import {
  INITIAL_AGENTS,
  INITIAL_COMPANY_CONFIG,
  INITIAL_ENTITIES,
  INITIAL_SWARM_LOGS,
} from './data/initialSwarmData';
import { generateAllProjectFiles } from './utils/codeGenerator';
import { downloadProjectZip } from './utils/zipExporter';
import DatabaseIntrospectorPanel from './components/DatabaseIntrospectorPanel';
import FrameworkMigrationAdvisorPanel from './components/FrameworkMigrationAdvisorPanel';
import AutoToolchainProvisionerPanel from './components/AutoToolchainProvisionerPanel';
import EndUserDashboardPreview from './components/EndUserDashboardPreview';
import { ECOSYSTEM_VERSION_PRESETS, resolveMigrationMode } from './utils/versionPresets';

type ActiveSection =
  | 'swarm_company'
  | 'visual_scaffolder'
  | 'ceo_command'
  | 'code_inspector'
  | 'manuals_deploy';

export default function App() {
  const [activeSection, setActiveSection] = useState<ActiveSection>('swarm_company');
  const [config, setConfig] = useState<CompanyConfig>(INITIAL_COMPANY_CONFIG);
  const [agents, setAgents] = useState<AgentEmployee[]>(INITIAL_AGENTS);
  const [entities, setEntities] = useState<CrudEntity[]>(INITIAL_ENTITIES);
  const [logs, setLogs] = useState<SwarmLogMessage[]>(INITIAL_SWARM_LOGS);
  const [customAiNotes, setCustomAiNotes] = useState<string>('');

  // AI Architect Prompt State
  const [aiBriefPrompt, setAiBriefPrompt] = useState<string>(
    'Sistema integral de gestión clínica y facturación médica con control de pacientes, citas, inventario de farmacia y roles de médico, recepcionista y administrador.'
  );
  const [isRunningSwarm, setIsRunningSwarm] = useState<boolean>(false);
  const [swarmStepText, setSwarmStepText] = useState<string>('');
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // Visual Generator Studio State
  const [selectedEntityId, setSelectedEntityId] = useState<string>(INITIAL_ENTITIES[0].id);
  const [showLiveSpaPreview, setShowLiveSpaPreview] = useState<boolean>(true);
  const [previewActiveRole, setPreviewActiveRole] = useState<string>('admin');
  const [previewSearch, setPreviewSearch] = useState<string>('');
  const [previewMockRows, setPreviewMockRows] = useState<Record<string, Array<Record<string, any>>>>({
    ent_customer: [
      { id: 101, company_name: 'Grupo Industrial Altamira S.A.', tax_id: 'B-84920112', credit_limit: 48500.0, status: 'activo' },
      { id: 102, company_name: 'Logística TransAndina Ltda.', tax_id: 'J-30918230', credit_limit: 22000.0, status: 'activo' },
      { id: 103, company_name: 'Tecnologías del Sur S.L.', tax_id: 'B-19283745', credit_limit: 12500.0, status: 'revision' },
    ],
    ent_invoice: [
      { id: 201, invoice_number: 'FAC-2026-0089', total_amount: 4250.0, due_date: '2026-10-15', is_paid: true },
      { id: 202, invoice_number: 'FAC-2026-0090', total_amount: 9800.5, due_date: '2026-10-28', is_paid: false },
    ],
    ent_inventory: [
      { id: 301, sku_code: 'SRV-NVME-2TB', title: 'Unidad SSD Enterprise NVMe 2TB', stock_units: 44, unit_price: 295.0 },
      { id: 302, sku_code: 'RTR-CORE-10G', title: 'Router Core 10GbE Administrable', stock_units: 12, unit_price: 840.0 },
    ],
  });
  const [newPreviewRowData, setNewPreviewRowData] = useState<Record<string, string>>({});

  // New Entity / Field Modal State
  const [newEntityName, setNewEntityName] = useState('');
  const [newEntityPlural, setNewEntityPlural] = useState('');
  const [newEntityDesc, setNewEntityDesc] = useState('');
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<FieldDefinition['type']>('string');
  const [newFieldWidget, setNewFieldWidget] = useState<FieldDefinition['filamentWidget']>('TextInput');

  // CEO Command Center State
  const [logChannelFilter, setLogChannelFilter] = useState<'all' | NotificationChannel>('all');
  const [ceoDirectiveInput, setCeoDirectiveInput] = useState<string>('');
  const [ceoTargetAgent, setCeoTargetAgent] = useState<AgentId>('visual_master_filament');
  const [isSendingDirective, setIsSendingDirective] = useState<boolean>(false);

  // Code Inspector & Manuals State
  const generatedFiles = useMemo(
    () => generateAllProjectFiles(config, entities, customAiNotes),
    [config, entities, customAiNotes]
  );
  const [selectedFilePath, setSelectedFilePath] = useState<string>('swarm_engine/langgraph_company.py');
  const [copiedFile, setCopiedFile] = useState<boolean>(false);
  const [selectedManualPath, setSelectedManualPath] = useState<string>(
    'docs/01_MANUAL_USUARIO_PRODUCTO_Y_EMPRESA_IA.md'
  );

  // ZIP & Deploy State
  const [zipReceipt, setZipReceipt] = useState<{
    fileName: string;
    fileCount: number;
    byteSize: number;
    timestamp: string;
  } | null>(null);
  const [deployStatusMsg, setDeployStatusMsg] = useState<string | null>(null);

  const selectedEntity = useMemo(
    () => entities.find((e) => e.id === selectedEntityId) || entities[0],
    [entities, selectedEntityId]
  );

  const currentCodeFile = useMemo(
    () => generatedFiles.find((f) => f.path === selectedFilePath) || generatedFiles[0],
    [generatedFiles, selectedFilePath]
  );

  const currentManualFile = useMemo(
    () => generatedFiles.find((f) => f.path === selectedManualPath) || generatedFiles.find((f) => f.category === 'manuals')!,
    [generatedFiles, selectedManualPath]
  );

  // Toggle CEO notification channel
  const toggleNotificationChannel = (ch: NotificationChannel) => {
    setConfig((prev) => {
      const exists = prev.preferredChannels.includes(ch);
      const updated = exists
        ? prev.preferredChannels.filter((c) => c !== ch)
        : [...prev.preferredChannels, ch];
      return {
        ...prev,
        preferredChannels: updated.length > 0 ? updated : ['log'],
      };
    });
  };

  // Run Full LangGraph Swarm Execution (with optional Gemini Architect generation)
  const handleExecuteSwarmWithAi = async (useGeminiArchitect: boolean) => {
    setErrorBanner(null);
    setIsRunningSwarm(true);

    const sequence: Array<{ id: AgentId; task: string }> = [
      { id: 'architect_orchestrator', task: 'Descomponiendo requerimiento con Divide y Vencerás en StateGraph...' },
      { id: 'db_migrations', task: `Generando migraciones nativas para ${config.databaseEngine.toUpperCase()} sin Docker...` },
      { id: 'security_rbac', task: 'Configurando Autenticación Laravel + Roles RBAC e Inertia Guard...' },
      { id: 'scaffolder_reverse', task: 'Ejecutando ingeniería inversa de LaraFast + InfyOm Generator...' },
      { id: 'visual_master_filament', task: 'Sabrina Nova sintetizando recursos visuales Filament PHP v3 + Craftable PRO + Nova...' },
      { id: 'frontend_architect_inertia', task: 'Valeria Thorne ensamblando 3 Diseños de Dashboard SPA en React + Inertia.js + Tailwind...' },
      { id: 'qa_self_healing', task: 'Aria Chen auditando frentes de trabajo y aplicando auto-corrección...' },
      { id: 'packager_deployer', task: 'Dante Rossi compactando paquete .ZIP y los manuales paso a paso...' },
    ];

    try {
      // Reset progress
      setAgents((prev) =>
        prev.map((a) => ({ ...a, status: 'idle', progress: 15 }))
      );

      for (let i = 0; i < sequence.length; i++) {
        const step = sequence[i];
        setSwarmStepText(step.task);
        setAgents((prev) =>
          prev.map((a) =>
            a.id === step.id
              ? { ...a, status: 'working', progress: 65, currentTask: step.task }
              : a
          )
        );

        if (i === 0 && useGeminiArchitect && aiBriefPrompt.trim()) {
          const response = await fetch('/api/swarm/architect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: aiBriefPrompt,
              companyName: config.companyName,
              databaseEngine: config.databaseEngine,
              laravelVersion: config.laravelVersion,
              dbProvisioningMode: config.dbProvisioningMode,
            }),
          });

          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || 'No se pudo completar la consulta al motor Gemini.');
          }

          const archData = await response.json();
          if (archData.projectName) {
            setConfig((prev) => ({
              ...prev,
              projectName: archData.projectName,
              projectSlug: archData.projectSlug || prev.projectSlug,
              projectDescription: archData.projectDescription || prev.projectDescription,
            }));
          }
          if (archData.executiveSummary) {
            setCustomAiNotes(archData.executiveSummary);
          }

          if (Array.isArray(archData.entities) && archData.entities.length > 0) {
            const mappedEntities: CrudEntity[] = archData.entities.map((ent: any, idx: number) => ({
              id: `ent_ai_${idx + 1}`,
              name: ent.name || `Module${idx + 1}`,
              pluralName: ent.pluralName || `${ent.name || 'Module'}s`,
              tableName: ent.tableName || `module_${idx + 1}s`,
              primaryKey: ent.primaryKey || 'id',
              hasTimestamps: ent.hasTimestamps !== false,
              isFromExistingDb: config.dbProvisioningMode === 'existing_introspect',
              icon: 'Layers',
              description: ent.description || 'Módulo CRUD generado por el Enjambre IA',
              enableExportCsv: true,
              enableSoftDeletes: false,
              scaffolderMode:
                ent.scaffolderMode === 'larafast_inertia' || ent.scaffolderMode === 'infyom_schema'
                  ? ent.scaffolderMode
                  : 'filament_craftable_nova',
              fields: Array.isArray(ent.fields)
                ? ent.fields.map((f: any, fIdx: number) => ({
                    id: `f_ai_${idx}_${fIdx}`,
                    name: f.name || `field_${fIdx}`,
                    label: f.label || f.name || 'Campo',
                    type: f.type || 'string',
                    required: Boolean(f.required),
                    searchable: Boolean(f.searchable),
                    sortable: Boolean(f.sortable),
                    filamentWidget: f.filamentWidget || 'TextInput',
                    foreignTable: f.foreignTable,
                    foreignKeyColumn: f.foreignKeyColumn,
                  }))
                : [],
              relationships: Array.isArray(ent.relationships)
                ? ent.relationships.map((r: any, rIdx: number) => ({
                    id: `rel_ai_${idx}_${rIdx}`,
                    type: r.type === 'hasMany' ? 'hasMany' : 'belongsTo',
                    methodName: r.methodName || 'related',
                    relatedModel: r.relatedModel || 'Related',
                    relatedTable: r.relatedTable || 'users',
                    foreignKey: r.foreignKey || 'id',
                    ownerKey: r.ownerKey || 'id',
                    displayColumn: r.displayColumn || 'id',
                  }))
                : [],
              customQueries: Array.isArray(ent.customQueries)
                ? ent.customQueries.map((q: any, qIdx: number) => ({
                    id: `q_ai_${idx}_${qIdx}`,
                    name: q.name || `consulta_${qIdx + 1}`,
                    description: q.description || 'Consulta SQL respetada',
                    sqlOrEloquent: q.sqlOrEloquent || `SELECT * FROM ${ent.tableName || 'table'};`,
                  }))
                : [],
            }));
            setEntities(mappedEntities);
            setSelectedEntityId(mappedEntities[0].id);

            // Seed mock rows for preview
            const newMocks: Record<string, Array<Record<string, any>>> = {};
            mappedEntities.forEach((me) => {
              const row1: Record<string, any> = { id: 1 };
              const row2: Record<string, any> = { id: 2 };
              me.fields.forEach((f) => {
                row1[f.name] =
                  f.type === 'decimal'
                    ? 1450.0
                    : f.type === 'integer'
                    ? 25
                    : f.type === 'boolean'
                    ? true
                    : f.type === 'date'
                    ? '2026-10-12'
                    : `${f.label} Demo A`;
                row2[f.name] =
                  f.type === 'decimal'
                    ? 3290.5
                    : f.type === 'integer'
                    ? 60
                    : f.type === 'boolean'
                    ? false
                    : f.type === 'date'
                    ? '2026-10-20'
                    : `${f.label} Demo B`;
              });
              newMocks[me.id] = [row1, row2];
            });
            setPreviewMockRows(newMocks);
          }

          const nowStr = new Date().toTimeString().slice(0, 8);
          setLogs((prev) => [
            {
              id: `log_ai_${Date.now()}_1`,
              timestamp: nowStr,
              fromAgent: 'qa_self_healing',
              toAgent: 'visual_master_filament',
              channel: 'log',
              severity: 'self_heal',
              subject: 'Auto-Corrección en Frente de Trabajo (Aria Chen -> Sabrina Nova)',
              detail:
                archData.selfHealingNote ||
                'Sincronización automática de tipos Eloquent y componentes Filament PHP v3 / Craftable PRO.',
              resolved: true,
            },
            {
              id: `log_ai_${Date.now()}_2`,
              timestamp: nowStr,
              fromAgent: 'architect_orchestrator',
              toAgent: 'CEO_SEO',
              channel: config.preferredChannels[0] || 'email',
              severity: 'ceo_decision',
              subject: `Nuevo Sistema Construido: ${archData.projectName || config.projectName}`,
              detail:
                archData.executiveSummary ||
                'El enjambre completó la generación de migraciones, autenticación con roles y generadores visuales.',
              resolved: false,
              ceoDecisionState: 'pending',
            },
            ...prev,
          ]);
        } else {
          await new Promise((r) => setTimeout(r, 260));
        }

        setAgents((prev) =>
          prev.map((a) =>
            a.id === step.id
              ? {
                  ...a,
                  status: 'completed',
                  progress: 100,
                  selfHealedCount: a.id === 'qa_self_healing' || a.id === 'visual_master_filament' ? a.selfHealedCount + 1 : a.selfHealedCount,
                }
              : a
          )
        );
      }

      setSwarmStepText('Enjambre sincronizado. Código fuente y los 3 manuales actualizados.');
    } catch (err: any) {
      setErrorBanner(err?.message || 'Error durante la ejecución del enjambre.');
    } finally {
      setIsRunningSwarm(false);
    }
  };

  // Add a new CRUD Entity manually in the Visual Scaffolder Studio
  const handleAddEntity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntityName.trim()) return;
    const cleanName = newEntityName.trim().replace(/\s+/g, '');
    const cleanPlural = newEntityPlural.trim() || `${cleanName}s`;
    const tableName = cleanPlural.toLowerCase().replace(/[^a-z0-9_]/g, '_');

    const newEnt: CrudEntity = {
      id: `ent_${Date.now()}`,
      name: cleanName,
      pluralName: cleanPlural,
      tableName,
      primaryKey: 'id',
      hasTimestamps: true,
      icon: 'Layers',
      description: newEntityDesc.trim() || `Módulo CRUD SPA para ${cleanPlural}`,
      enableExportCsv: true,
      enableSoftDeletes: true,
      scaffolderMode: 'filament_craftable_nova',
      fields: [
        {
          id: `f_${Date.now()}_1`,
          name: 'name',
          label: 'Nombre Principal',
          type: 'string',
          required: true,
          searchable: true,
          sortable: true,
          filamentWidget: 'TextInput',
        },
        {
          id: `f_${Date.now()}_2`,
          name: 'status',
          label: 'Estado',
          type: 'enum',
          required: true,
          searchable: true,
          sortable: true,
          filamentWidget: 'BadgeColumn',
          enumOptions: ['activo', 'pendiente', 'archivado'],
        },
      ],
      relationships: [],
      customQueries: [],
    };

    setEntities((prev) => [...prev, newEnt]);
    setSelectedEntityId(newEnt.id);
    setPreviewMockRows((prev) => ({
      ...prev,
      [newEnt.id]: [{ id: 1, name: `${cleanName} Inicial`, status: 'activo' }],
    }));
    setNewEntityName('');
    setNewEntityPlural('');
    setNewEntityDesc('');
  };

  // Add a field to the currently selected CRUD Entity
  const handleAddField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFieldName.trim() || !selectedEntity) return;
    const cleanField = newFieldName
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_');

    const fieldObj: FieldDefinition = {
      id: `f_${Date.now()}`,
      name: cleanField,
      label: newFieldLabel.trim() || cleanField,
      type: newFieldType,
      required: true,
      searchable: newFieldType === 'string' || newFieldType === 'enum',
      sortable: true,
      filamentWidget: newFieldWidget,
    };

    setEntities((prev) =>
      prev.map((ent) =>
        ent.id === selectedEntity.id
          ? { ...ent, fields: [...ent.fields, fieldObj] }
          : ent
      )
    );
    setNewFieldName('');
    setNewFieldLabel('');
  };

  const handleRemoveField = (fieldId: string) => {
    if (!selectedEntity || selectedEntity.fields.length <= 1) return;
    setEntities((prev) =>
      prev.map((ent) =>
        ent.id === selectedEntity.id
          ? { ...ent, fields: ent.fields.filter((f) => f.id !== fieldId) }
          : ent
      )
    );
  };

  // Live SPA Preview: Create new row
  const handleAddPreviewRow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntity) return;
    const currentRows = previewMockRows[selectedEntity.id] || [];
    const nextId = currentRows.length > 0 ? Math.max(...currentRows.map((r) => Number(r.id) || 0)) + 1 : 1;
    const newRow: Record<string, any> = { id: nextId };
    selectedEntity.fields.forEach((f) => {
      newRow[f.name] = newPreviewRowData[f.name] || (f.type === 'boolean' ? 'true' : f.type === 'decimal' ? '0.00' : 'Nuevo valor');
    });

    setPreviewMockRows((prev) => ({
      ...prev,
      [selectedEntity.id]: [newRow, ...currentRows],
    }));
    setNewPreviewRowData({});
  };

  // Send Direct CEO Order to an AI Agent via Backend Gemini API
  const handleSendCeoDirective = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ceoDirectiveInput.trim()) return;
    setIsSendingDirective(true);
    setErrorBanner(null);

    const targetAgentObj = agents.find((a) => a.id === ceoTargetAgent) || agents[4];
    try {
      const res = await fetch('/api/swarm/ceo-directive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          directive: ceoDirectiveInput,
          targetAgent: `${targetAgentObj.name} (${targetAgentObj.roleTitle})`,
          companyConfig: config,
          entitiesCount: entities.length,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al procesar directiva del CEO.');
      }

      const newLog: SwarmLogMessage = {
        id: `log_ceo_${Date.now()}`,
        timestamp: data.timestamp || new Date().toTimeString().slice(0, 8),
        fromAgent: ceoTargetAgent,
        toAgent: 'CEO_SEO',
        channel: config.preferredChannels[0] || 'email',
        severity: 'completed',
        subject: `Respuesta a Directiva del CEO: "${ceoDirectiveInput.slice(0, 55)}..."`,
        detail: data.reply,
        resolved: true,
        ceoDecisionState: 'approved',
      };

      setLogs((prev) => [newLog, ...prev]);
      setCeoDirectiveInput('');
    } catch (err: any) {
      setErrorBanner(err?.message || 'Error de comunicación con el agente.');
    } finally {
      setIsSendingDirective(false);
    }
  };

  // Handle CEO Decision approval on pending log checkpoints
  const handleCeoDecision = (logId: string, decision: 'approved' | 'modified') => {
    setLogs((prev) =>
      prev.map((l) =>
        l.id === logId ? { ...l, resolved: true, ceoDecisionState: decision } : l
      )
    );
  };

  // Handle Real ZIP Download
  const handleDownloadZipBundle = async () => {
    const result = await downloadProjectZip(config, generatedFiles);
    const nowTime = new Date().toTimeString().slice(0, 8);
    setZipReceipt({
      ...result,
      timestamp: nowTime,
    });
    setLogs((prev) => [
      {
        id: `log_zip_${Date.now()}`,
        timestamp: nowTime,
        fromAgent: 'packager_deployer',
        toAgent: 'CEO_SEO',
        channel: config.preferredChannels[0] || 'log',
        severity: 'completed',
        subject: `Paquete ZIP Exportado: ${result.fileName}`,
        detail: `Dante Rossi empaquetó ${result.fileCount} archivos (${(result.byteSize / 1024).toFixed(1)} KB) incluyendo el motor Python LangGraph, la aplicación Laravel + React + Inertia + Filament y los 3 manuales de instalación y exportación.`,
        resolved: true,
        ceoDecisionState: 'approved',
      },
      ...prev,
    ]);
  };

  // Copy code to clipboard
  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFile(true);
    setTimeout(() => setCopiedFile(false), 1800);
  };

  // Download single markdown manual
  const handleDownloadSingleManual = (path: string, content: string) => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = path.split('/').pop() || 'MANUAL.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  };

  const filteredLogs = useMemo(
    () => (logChannelFilter === 'all' ? logs : logs.filter((l) => l.channel === logChannelFilter)),
    [logs, logChannelFilter]
  );

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col">
      {/* STRICT 3-ZONE TOP BAR CONTRACT */}
      <header className="flex items-center justify-between px-6 py-3.5 border-b border-slate-800 bg-[#0F172A] sticky top-0 z-30">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveSection('swarm_company');
          }}
          className="text-lg font-bold tracking-tight text-white whitespace-nowrap"
        >
          Ramonov Swarm Studio
        </a>

        {/* Zone 2: 5 clean text navigation links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-400">
          <button
            onClick={() => setActiveSection('swarm_company')}
            className={`hover:text-white transition-colors whitespace-nowrap py-1 ${
              activeSection === 'swarm_company' ? 'text-white underline underline-offset-8 decoration-amber-500 decoration-2' : ''
            }`}
          >
            Empresa & Enjambre
          </button>
          <button
            onClick={() => setActiveSection('visual_scaffolder')}
            className={`hover:text-white transition-colors whitespace-nowrap py-1 ${
              activeSection === 'visual_scaffolder' ? 'text-white underline underline-offset-8 decoration-amber-500 decoration-2' : ''
            }`}
          >
            Generador Visual
          </button>
          <button
            onClick={() => setActiveSection('ceo_command')}
            className={`hover:text-white transition-colors whitespace-nowrap py-1 ${
              activeSection === 'ceo_command' ? 'text-white underline underline-offset-8 decoration-amber-500 decoration-2' : ''
            }`}
          >
            Decisiones CEO
          </button>
          <button
            onClick={() => setActiveSection('code_inspector')}
            className={`hover:text-white transition-colors whitespace-nowrap py-1 ${
              activeSection === 'code_inspector' ? 'text-white underline underline-offset-8 decoration-amber-500 decoration-2' : ''
            }`}
          >
            Código Generado
          </button>
          <button
            onClick={() => setActiveSection('manuals_deploy')}
            className={`hover:text-white transition-colors whitespace-nowrap py-1 ${
              activeSection === 'manuals_deploy' ? 'text-white underline underline-offset-8 decoration-amber-500 decoration-2' : ''
            }`}
          >
            Manuales & Despliegue
          </button>
        </nav>

        {/* Zone 3: Primary action */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadZipBundle}
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-500 rounded-md hover:bg-amber-400 transition-colors whitespace-nowrap flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar Sistema (.ZIP)
          </button>
        </div>
      </header>

      {/* WORKSPACE CANVAS: SIDEBAR (260px) + MAIN VIEWPORT */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Left Sidebar Navigation */}
        <aside className="w-full md:w-[260px] shrink-0 border-b md:border-b-0 md:border-r border-slate-800 bg-[#0F172A] p-4 flex flex-col justify-between gap-6">
          <div className="space-y-6">
            {/* Company Identity Summary (Unboxed Clean Metadata) */}
            <div className="pb-4 border-b border-slate-800/80 space-y-1.5">
              <p className="text-xs text-slate-400">Empresa Virtual Activa</p>
              <h2 className="text-sm font-semibold text-white truncate">{config.companyName}</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Python LangGraph · Sin Docker · {config.databaseEngine.toUpperCase()}
              </p>
            </div>

            {/* Primary Workspace Switcher */}
            <div className="space-y-1">
              <p className="px-2 pb-1 text-xs font-medium text-slate-400">Frentes de Trabajo</p>
              <button
                onClick={() => setActiveSection('swarm_company')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  activeSection === 'swarm_company'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <span className="flex items-center gap-2.5 truncate">
                  <Layers className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>01. Empresa & Empleados IA</span>
                </span>
                <span className="font-mono tabular-nums text-slate-400">7</span>
              </button>

              <button
                onClick={() => setActiveSection('visual_scaffolder')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  activeSection === 'visual_scaffolder'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <span className="flex items-center gap-2.5 truncate">
                  <Sliders className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>02. Generador Visual</span>
                </span>
                <span className="font-mono tabular-nums text-slate-400">{entities.length}</span>
              </button>

              <button
                onClick={() => setActiveSection('ceo_command')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  activeSection === 'ceo_command'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <span className="flex items-center gap-2.5 truncate">
                  <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>03. Centro CEO / SEO</span>
                </span>
                <span className="font-mono tabular-nums text-amber-400">
                  {logs.filter((l) => l.ceoDecisionState === 'pending').length || logs.length}
                </span>
              </button>

              <button
                onClick={() => setActiveSection('code_inspector')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  activeSection === 'code_inspector'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <span className="flex items-center gap-2.5 truncate">
                  <FileCode className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>04. Código Fuente</span>
                </span>
                <span className="font-mono tabular-nums text-slate-400">{generatedFiles.length}</span>
              </button>

              <button
                onClick={() => setActiveSection('manuals_deploy')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  activeSection === 'manuals_deploy'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <span className="flex items-center gap-2.5 truncate">
                  <BookOpen className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>05. Manuales (3) & FTP</span>
                </span>
                <span className="font-mono tabular-nums text-slate-400">3</span>
              </button>
            </div>

            {/* Quick Database Selector */}
            <div className="pt-4 border-t border-slate-800/80 space-y-2">
              <p className="text-xs font-medium text-slate-400">Motor de Base de Datos</p>
              <div className="grid grid-cols-3 gap-1 p-1 bg-slate-900 rounded-md border border-slate-800">
                {(['mysql', 'pgsql', 'sqlite'] as DatabaseEngine[]).map((db) => (
                  <button
                    key={db}
                    onClick={() => setConfig((prev) => ({ ...prev, databaseEngine: db }))}
                    className={`py-1.5 text-xs font-mono font-medium rounded transition-colors cursor-pointer ${
                      config.databaseEngine === db
                        ? 'bg-amber-500 text-slate-950 font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {db === 'mysql' ? 'MySQL' : db === 'pgsql' ? 'Postgres' : 'SQLite'}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-400">
                Laravel {config.laravelVersion} · Inertia · React · Vite
              </p>
            </div>
          </div>

          {/* Slogan Block */}
          <div className="pt-4 border-t border-slate-800 text-xs text-slate-400 space-y-1">
            <p className="font-semibold text-slate-200">Filosofía Sabrina Ramonov</p>
            <p className="leading-relaxed">"{config.slogan}"</p>
          </div>
        </aside>

        {/* Main Content Viewport */}
        <main className="flex-1 min-w-0 p-6 md:p-8 space-y-8 overflow-y-auto">
          {errorBanner && (
            <div className="p-4 rounded-md border border-red-500/40 bg-red-950/30 text-red-200 text-sm flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorBanner}</span>
              </div>
              <button
                onClick={() => setErrorBanner(null)}
                className="text-xs underline hover:text-white"
              >
                Cerrar
              </button>
            </div>
          )}

          {/* ===================================================================
              SECTION 1: EMPRESA VIRTUAL & ENJAMBRE DE EMPLEADOS IA (LANGGRAPH)
             =================================================================== */}
          {activeSection === 'swarm_company' && (
            <div className="space-y-8 max-w-6xl">
              {/* Top Context & Primary Action */}
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 border-b border-slate-800">
                <div className="space-y-2 max-w-2xl">
                  <div className="flex items-center gap-2 text-xs text-amber-400 font-medium">
                    <span>Arquitectura Enjambre Basado en Roles</span>
                    <span aria-hidden="true">·</span>
                    <span>Metodología Divide y Vencerás</span>
                    <span aria-hidden="true">·</span>
                    <span>Python + LangGraph</span>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                    Dirección de Empresa Virtual de Desarrollo de Software
                  </h1>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Configure su empresa de agentes autónomos en Python con LangGraph. Los empleados IA colaboran, aplican ingeniería inversa de <strong>LaraFast</strong>, <strong>InfyOm</strong>, <strong>Craftable PRO</strong>, <strong>Nova Adaptable</strong> y <strong>Filament PHP</strong>, corrigen errores en su frente de trabajo y reportan al CEO/SEO sin utilizar Docker.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => handleExecuteSwarmWithAi(false)}
                    disabled={isRunningSwarm}
                    className="px-4 py-2.5 rounded-md border border-slate-700 bg-slate-900 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRunningSwarm ? 'animate-spin' : ''}`} />
                    Sincronizar Grafo LangGraph
                  </button>
                  <button
                    onClick={() => setActiveSection('visual_scaffolder')}
                    className="px-4 py-2.5 rounded-md bg-amber-500 text-slate-950 text-xs font-semibold hover:bg-amber-400 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    Abrir Agente Generador Visual
                  </button>
                </div>
              </div>

              {/* AI Prompt Box to Build Any Custom Software System */}
              <section className="p-6 rounded-lg border border-slate-800 bg-[#1E293B]/60 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base font-semibold text-white">
                      Ordenar la Creación de un Nuevo Sistema al Enjambre de Empleados IA
                    </h2>
                    <p className="text-xs text-slate-400">
                      Describa el software CRUD SPA que desea encargar a su empresa virtual o elija una plantilla táctica:
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setAiBriefPrompt(
                          'ERP de Inventario, Compras, Facturación y Clientes con alertas de stock mínimo y reportes por sucursal.'
                        )
                      }
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors whitespace-nowrap cursor-pointer"
                    >
                      Plantilla ERP
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setAiBriefPrompt(
                          'Sistema Clínico Hospitalario con Pacientes, Historias Médicas, Citas Especializadas y Recetas de Farmacia.'
                        )
                      }
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors whitespace-nowrap cursor-pointer"
                    >
                      Plantilla Clínica
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setAiBriefPrompt(
                          'CRM Inmobiliario con Propiedades, Contratos de Arrendamiento, Propietarios y Pagos Mensuales.'
                        )
                      }
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors whitespace-nowrap cursor-pointer"
                    >
                      Plantilla Inmobiliaria
                    </button>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-3">
                  <textarea
                    rows={2}
                    value={aiBriefPrompt}
                    onChange={(e) => setAiBriefPrompt(e.target.value)}
                    placeholder="Describa los módulos, tablas y reglas del sistema que los agentes IA deben construir..."
                    className="flex-1 rounded-md bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none"
                  />
                  <button
                    onClick={() => handleExecuteSwarmWithAi(true)}
                    disabled={isRunningSwarm}
                    className="px-5 py-3 rounded-md bg-amber-500 text-slate-950 font-semibold text-xs hover:bg-amber-400 transition-colors flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" />
                    {isRunningSwarm ? 'Ejecutando Enjambre IA...' : 'Diseñar y Construir Sistema con IA'}
                  </button>
                </div>

                {swarmStepText && (
                  <div className="pt-2 flex items-center justify-between text-xs text-amber-300 font-mono">
                    <span>Estado del Grafo LangGraph: {swarmStepText}</span>
                    <span className="tabular-nums">{entities.length} Módulos CRUD Activos</span>
                  </div>
                )}
              </section>

              {/* Company Configuration & Stack Settings Grid */}
              <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column: Company & CEO Notification Channels */}
                <div className="p-6 rounded-lg border border-slate-800 bg-[#1E293B]/40 space-y-4">
                  <h3 className="text-base font-semibold text-white">
                    01. Configuración de la Empresa y Reportes al CEO / SEO
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Nombre de la Empresa Virtual</label>
                      <input
                        type="text"
                        value={config.companyName}
                        onChange={(e) => setConfig({ ...config, companyName: e.target.value })}
                        className="w-full rounded-md bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Nombre del Proyecto a Generar</label>
                      <input
                        type="text"
                        value={config.projectName}
                        onChange={(e) => setConfig({ ...config, projectName: e.target.value })}
                        className="w-full rounded-md bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Correo del CEO / SEO (Alertas)</label>
                      <input
                        type="email"
                        value={config.ceoEmail}
                        onChange={(e) => setConfig({ ...config, ceoEmail: e.target.value })}
                        className="w-full rounded-md bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white font-mono focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Teléfono / WhatsApp del CEO</label>
                      <input
                        type="text"
                        value={config.ceoPhone}
                        onChange={(e) => setConfig({ ...config, ceoPhone: e.target.value })}
                        className="w-full rounded-md bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white font-mono focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="block text-xs text-slate-400 mb-2">
                      Vías de Comunicación de los Agentes con el CEO / SEO:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {(
                        [
                          { id: 'email', label: 'Correo Electrónico (SMTP)' },
                          { id: 'phone', label: 'Teléfono / SMS / WhatsApp' },
                          { id: 'log', label: 'Logs de Auditoría (ceo_executive_audit.log)' },
                        ] as Array<{ id: NotificationChannel; label: string }>
                      ).map((ch) => {
                        const active = config.preferredChannels.includes(ch.id);
                        return (
                          <button
                            key={ch.id}
                            type="button"
                            onClick={() => toggleNotificationChannel(ch.id)}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                              active
                                ? 'bg-amber-500/15 border-amber-500 text-amber-300'
                                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            {active ? '✓ ' : '+ '}
                            {ch.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Right Column: Technical Stack (Laravel, DB Engine, Auth Roles, XAMPP/FTP) */}
                <div className="p-6 rounded-lg border border-slate-800 bg-[#1E293B]/40 space-y-4">
                  <h3 className="text-base font-semibold text-white">
                    02. Parámetros del Stack (Laravel + React + Inertia + Tailwind + BD)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Base de Datos a Seleccionar</label>
                      <select
                        value={config.databaseEngine}
                        onChange={(e) =>
                          setConfig({ ...config, databaseEngine: e.target.value as DatabaseEngine })
                        }
                        className="w-full rounded-md bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                      >
                        <option value="mysql">MySQL / MariaDB (XAMPP v3.3.0 / Nativo)</option>
                        <option value="pgsql">PostgreSQL 16 (Relacional Avanzado)</option>
                        <option value="sqlite">SQLite 3 (Archivo Local Cero-Servidor)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">
                        Versión Framework Laravel (Decisión del CEO)
                      </label>
                      <select
                        value={config.laravelVersion}
                        onChange={(e) => {
                          const targetVer = e.target.value as LaravelVersion;
                          setConfig((prev) => ({
                            ...prev,
                            laravelVersion: targetVer,
                            migrationMode: resolveMigrationMode(targetVer, prev.migrationMode),
                            versionMatrix: { ...ECOSYSTEM_VERSION_PRESETS[targetVer] },
                          }));
                        }}
                        className="w-full rounded-md bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                      >
                        <option value="9.x">Laravel 9.x Clásico + React 18.2 + Inertia 1.0 + Vite 4</option>
                        <option value="10.x">Migrar / Crear en Laravel 10.x LTS + React 18.3 + Vite 5</option>
                        <option value="11.x">Migrar / Crear en Laravel 11.x + React 19 + Inertia 2 + Vite 6</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Nombre de Base de Datos</label>
                      <input
                        type="text"
                        value={config.dbName}
                        onChange={(e) => setConfig({ ...config, dbName: e.target.value })}
                        className="w-full rounded-md bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white font-mono focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Roles Generados por Agente Seguridad</label>
                      <input
                        type="text"
                        value={config.authRoles.join(', ')}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            authRoles: e.target.value
                              .split(',')
                              .map((s) => s.trim())
                              .filter(Boolean),
                          })
                        }
                        className="w-full rounded-md bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white font-mono focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs text-slate-400">
                      Origen de la Base de Datos:{' '}
                      <strong className="text-amber-300">
                        {config.dbProvisioningMode === 'existing_introspect'
                          ? 'BD Existente (Respeta Tablas, PKs, Relaciones y Consultas)'
                          : 'Crear Nueva BD desde Cero'}
                      </strong>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setConfig((prev) => ({
                          ...prev,
                          dbProvisioningMode:
                            prev.dbProvisioningMode === 'existing_introspect'
                              ? 'new_from_scratch'
                              : 'existing_introspect',
                        }))
                      }
                      className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-amber-300 hover:bg-slate-800 cursor-pointer"
                    >
                      Cambiar Modo BD
                    </button>
                  </div>
                </div>
              </section>

              {/* Transparent Framework Version & Ecosystem Migration Governance for the CEO */}
              <FrameworkMigrationAdvisorPanel
                config={config}
                setConfig={setConfig}
                onCeoVersionDecision={(ver, summary) => {
                  const nowStr = new Date().toTimeString().slice(0, 8);
                  setLogs((prev) => [
                    {
                      id: `log_ver_${Date.now()}`,
                      timestamp: nowStr,
                      fromAgent: 'architect_orchestrator',
                      toAgent: 'CEO_SEO',
                      channel: config.preferredChannels[0] || 'email',
                      severity: 'completed',
                      subject: `Decisión del CEO Aplicada: Ecosistema Sincronizado en Laravel ${ver}`,
                      detail: summary,
                      resolved: true,
                      ceoDecisionState: 'approved',
                    },
                    ...prev,
                  ]);
                }}
              />

              {/* Automated Pre-Flight Version Checker & Tool Installer (Alerts CEO & Auto-Installs) */}
              <AutoToolchainProvisionerPanel
                config={config}
                onReportToCeo={(subject, detail, isResolved) => {
                  const nowStr = new Date().toTimeString().slice(0, 8);
                  setLogs((prev) => [
                    {
                      id: `log_auto_tool_${Date.now()}`,
                      timestamp: nowStr,
                      fromAgent: 'qa_self_healing',
                      toAgent: 'CEO_SEO',
                      channel: config.preferredChannels[0] || 'email',
                      severity: isResolved ? 'completed' : 'ceo_decision',
                      subject,
                      detail,
                      resolved: isResolved,
                      ceoDecisionState: isResolved ? 'approved' : 'pending',
                    },
                    ...prev,
                  ]);
                }}
              />

              {/* High-Density Roster of the 7 Autonomous AI Agent Employees */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      Plantilla de Empleados IA en LangGraph (Enjambre Basado en Roles)
                    </h2>
                    <p className="text-xs text-slate-400">
                      Cada empleado opera en su frente de trabajo, se comunica con sus pares y auto-corrige discrepancias antes de empaquetar.
                    </p>
                  </div>
                  <span className="text-xs font-mono tabular-nums text-slate-400">
                    7 Nodos Activos · {agents.reduce((acc, a) => acc + a.selfHealedCount, 0)} Auto-Correcciones
                  </span>
                </div>

                <div className="overflow-x-auto rounded-lg border border-slate-800 bg-[#1E293B]/30">
                  <table className="min-w-full divide-y divide-slate-800 text-left">
                    <thead className="bg-slate-900/90">
                      <tr>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-300">Empleado Agente IA</th>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-300">Especialidad & Frente de Trabajo</th>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-300">Herramientas Integradas</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-300">Parches QA</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-300">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {agents.map((agent) => (
                        <tr
                          key={agent.id}
                          className={`hover:bg-slate-800/40 transition-colors ${
                            agent.perfectedBadge ? 'bg-amber-500/5' : ''
                          }`}
                        >
                          <td className="px-4 py-3.5 align-top">
                            <div className="font-semibold text-sm text-white">{agent.name}</div>
                            <div className="text-xs text-slate-400">{agent.roleTitle}</div>
                            {agent.perfectedBadge && (
                              <div className="text-xs text-amber-400 font-medium mt-1">
                                ★ Agente Perfeccionado (Compacto, Robusto y Profesional)
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3.5 align-top max-w-md">
                            <div className="text-xs font-medium text-slate-200">{agent.specialty}</div>
                            <div className="text-xs text-slate-400 mt-1">{agent.currentTask}</div>
                          </td>
                          <td className="px-4 py-3.5 align-top">
                            <div className="text-xs text-slate-300">
                              {agent.toolsUsed.join(' · ')}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 align-top text-right font-mono tabular-nums text-xs text-slate-300">
                            {agent.selfHealedCount}
                          </td>
                          <td className="px-4 py-3.5 align-top text-right whitespace-nowrap">
                            {agent.status === 'working' ? (
                              <span className="text-xs font-mono text-amber-400">
                                Procesando ({agent.progress}%)
                              </span>
                            ) : (
                              <span className="text-xs font-mono text-emerald-400 flex items-center justify-end gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Operativo (100%)
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {/* ===================================================================
              SECTION 2: AGENTE MAESTRO GENERADOR VISUAL PERFECCIONADO
              (FILAMENT PHP + CRAFTABLE PRO + NOVA ADAPTABLE + LARAFAST + INFYOM)
             =================================================================== */}
          {activeSection === 'visual_scaffolder' && (
            <div className="space-y-8 max-w-6xl">
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 border-b border-slate-800">
                <div className="space-y-2 max-w-2xl">
                  <div className="flex items-center gap-2 text-xs text-amber-400 font-medium">
                    <span>Agente 05: Sabrina Nova (Perfeccionado)</span>
                    <span aria-hidden="true">·</span>
                    <span>Ingeniería Inversa de Scaffolders</span>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                    Generador Visual: Filament PHP + Craftable PRO + Nova + LaraFast + InfyOm
                  </h1>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Diseñe visualmente sus entidades CRUD. El agente perfeccionado aplica ingeniería inversa para generar al instante el código de <strong>LaraFast</strong> (SPA React + Inertia + Tailwind), el esquema JSON de <strong>InfyOm</strong> y los paneles visuales de <strong>Filament PHP v3</strong> y <strong>Craftable PRO / Nova Adaptable</strong>.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowLiveSpaPreview(!showLiveSpaPreview)}
                    className={`px-4 py-2.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                      showLiveSpaPreview
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'border border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    {showLiveSpaPreview ? 'Ver Diseñador de Esquemas / Campos' : 'Ver Suite de Dashboards SPA (3 Diseños)'}
                  </button>
                </div>
              </div>

              {/* Database Introspector & Existing Schema / Relationships / Queries Panel */}
              <DatabaseIntrospectorPanel
                config={config}
                setConfig={setConfig}
                entities={entities}
                setEntities={setEntities}
                selectedEntity={selectedEntity}
                setSelectedEntityId={setSelectedEntityId}
                onIntrospectionComplete={(summaryMsg, importedEntities) => {
                  const nowStr = new Date().toTimeString().slice(0, 8);
                  const newMocks: Record<string, Array<Record<string, any>>> = {};
                  importedEntities.forEach((ie) => {
                    const row1: Record<string, any> = { id: 1, [ie.primaryKey]: 1 };
                    const row2: Record<string, any> = { id: 2, [ie.primaryKey]: 2 };
                    ie.fields.forEach((f) => {
                      row1[f.name] =
                        f.type === 'decimal'
                          ? 1850.0
                          : f.type === 'integer' || f.type === 'foreignId'
                          ? 1
                          : f.type === 'boolean'
                          ? true
                          : f.type === 'date'
                          ? '2026-10-15'
                          : `${f.label} #1`;
                      row2[f.name] =
                        f.type === 'decimal'
                          ? 4200.5
                          : f.type === 'integer' || f.type === 'foreignId'
                          ? 2
                          : f.type === 'boolean'
                          ? false
                          : f.type === 'date'
                          ? '2026-10-22'
                          : `${f.label} #2`;
                    });
                    newMocks[ie.id] = [row1, row2];
                  });
                  setPreviewMockRows(newMocks);
                  setLogs((prev) => [
                    {
                      id: `log_intro_${Date.now()}`,
                      timestamp: nowStr,
                      fromAgent: 'db_migrations',
                      toAgent: 'CEO_SEO',
                      channel: config.preferredChannels[0] || 'log',
                      severity: 'self_heal',
                      subject: 'Base de Datos Existente Importada y Respetada en el Generador Visual',
                      detail: summaryMsg,
                      resolved: true,
                      ceoDecisionState: 'approved',
                    },
                    ...prev,
                  ]);
                }}
              />

              {showLiveSpaPreview ? (
                /* MULTI-THEME LIVE SPA DASHBOARD SUITE FOR THE END USER (VALERIA THORNE) */
                <EndUserDashboardPreview
                  config={config}
                  entities={entities}
                  selectedEntity={selectedEntity}
                  onSelectEntity={setSelectedEntityId}
                  mockRows={previewMockRows}
                  onUpdateMockRows={setPreviewMockRows}
                />
              ) : (
                /* VISUAL SCHEMA & REVERSE-ENGINEERED SCAFFOLDER DESIGNER */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: CRUD Entities List + Create New Entity */}
                  <div className="space-y-6">
                    <div className="p-5 rounded-lg border border-slate-800 bg-[#1E293B]/40 space-y-3">
                      <h3 className="text-sm font-semibold text-white">Módulos CRUD del Sistema</h3>
                      <div className="space-y-1.5">
                        {entities.map((ent) => (
                          <div
                            key={ent.id}
                            onClick={() => setSelectedEntityId(ent.id)}
                            className={`p-3 rounded-md border transition-colors cursor-pointer flex items-center justify-between ${
                              selectedEntity?.id === ent.id
                                ? 'bg-slate-800/90 border-amber-500/60 text-white'
                                : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-900'
                            }`}
                          >
                            <div>
                              <div className="text-sm font-semibold">{ent.pluralName}</div>
                              <div className="text-xs text-slate-400 font-mono">
                                Tabla: {ent.tableName} · {ent.fields.length} campos
                              </div>
                            </div>
                            {entities.length > 1 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const remaining = entities.filter((item) => item.id !== ent.id);
                                  setEntities(remaining);
                                  if (selectedEntityId === ent.id) {
                                    setSelectedEntityId(remaining[0].id);
                                  }
                                }}
                                className="p-1.5 text-slate-500 hover:text-red-400"
                                title="Eliminar entidad"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Add New Entity Form */}
                    <form
                      onSubmit={handleAddEntity}
                      className="p-5 rounded-lg border border-slate-800 bg-[#1E293B]/40 space-y-3"
                    >
                      <h3 className="text-sm font-semibold text-white">+ Agregar Nuevo Módulo CRUD</h3>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Nombre Entidad (Singular, ej: Project)</label>
                        <input
                          type="text"
                          value={newEntityName}
                          onChange={(e) => setNewEntityName(e.target.value)}
                          placeholder="Project"
                          className="w-full rounded bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs text-white"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Nombre Plural (ej: Projects)</label>
                        <input
                          type="text"
                          value={newEntityPlural}
                          onChange={(e) => setNewEntityPlural(e.target.value)}
                          placeholder="Projects"
                          className="w-full rounded bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Descripción Funcional</label>
                        <input
                          type="text"
                          value={newEntityDesc}
                          onChange={(e) => setNewEntityDesc(e.target.value)}
                          placeholder="Control de proyectos y entregas..."
                          className="w-full rounded bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs text-white"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full py-2 rounded bg-amber-500 text-slate-950 font-semibold text-xs hover:bg-amber-400 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Añadir al Generador Visual
                      </button>
                    </form>
                  </div>

                  {/* Right 2 Columns: Selected Entity Fields & Reverse-Engineered Scaffolder Mode */}
                  {selectedEntity && (
                    <div className="lg:col-span-2 space-y-6">
                      <div className="p-6 rounded-lg border border-slate-800 bg-[#1E293B]/40 space-y-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                          <div>
                            <h2 className="text-lg font-semibold text-white">
                              Esquema Visual de {selectedEntity.pluralName} ({selectedEntity.name})
                            </h2>
                            <p className="text-xs text-slate-400">{selectedEntity.description}</p>
                          </div>

                          <div>
                            <label className="block text-xs text-slate-400 mb-1">
                              Motor Scaffolder (Ingeniería Inversa):
                            </label>
                            <select
                              value={selectedEntity.scaffolderMode}
                              onChange={(e) => {
                                const mode = e.target.value as CrudEntity['scaffolderMode'];
                                setEntities((prev) =>
                                  prev.map((ent) =>
                                    ent.id === selectedEntity.id ? { ...ent, scaffolderMode: mode } : ent
                                  )
                                );
                              }}
                              className="rounded bg-slate-950 border border-slate-700 px-3 py-1.5 text-xs text-amber-300 font-medium"
                            >
                              <option value="filament_craftable_nova">
                                Filament PHP v3 + Craftable PRO + Nova Adaptable (Perfeccionado)
                              </option>
                              <option value="larafast_inertia">
                                LaraFast Boilerplate (Laravel + Inertia + React + Tailwind)
                              </option>
                              <option value="infyom_schema">
                                InfyOm Laravel Generator (JSON Schema + Repository)
                              </option>
                            </select>
                          </div>
                        </div>

                        {/* Fields Table */}
                        <div className="overflow-x-auto rounded border border-slate-800">
                          <table className="min-w-full divide-y divide-slate-800 text-left">
                            <thead className="bg-slate-900">
                              <tr>
                                <th className="px-3.5 py-2.5 text-xs font-semibold text-slate-300">Columna BD</th>
                                <th className="px-3.5 py-2.5 text-xs font-semibold text-slate-300">Etiqueta UI</th>
                                <th className="px-3.5 py-2.5 text-xs font-semibold text-slate-300">Tipo Eloquent</th>
                                <th className="px-3.5 py-2.5 text-xs font-semibold text-slate-300">
                                  Widget Filament / Craftable
                                </th>
                                <th className="px-3.5 py-2.5 text-right text-xs font-semibold text-slate-300">
                                  Acción
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                              {selectedEntity.fields.map((field) => (
                                <tr key={field.id} className="hover:bg-slate-900/40">
                                  <td className="px-3.5 py-2.5 text-xs font-mono text-amber-300">{field.name}</td>
                                  <td className="px-3.5 py-2.5 text-xs text-slate-200">{field.label}</td>
                                  <td className="px-3.5 py-2.5 text-xs font-mono text-slate-400">{field.type}</td>
                                  <td className="px-3.5 py-2.5 text-xs font-mono text-emerald-400">
                                    {field.filamentWidget}
                                  </td>
                                  <td className="px-3.5 py-2.5 text-right">
                                    <button
                                      onClick={() => handleRemoveField(field.id)}
                                      className="text-xs text-slate-500 hover:text-red-400 cursor-pointer"
                                    >
                                      Quitar
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Add New Field to Entity */}
                        <form
                          onSubmit={handleAddField}
                          className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2 items-end"
                        >
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">Columna (snake_case)</label>
                            <input
                              type="text"
                              value={newFieldName}
                              onChange={(e) => setNewFieldName(e.target.value)}
                              placeholder="ej: phone_number"
                              className="w-full rounded bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-xs text-white font-mono"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">Etiqueta Visual</label>
                            <input
                              type="text"
                              value={newFieldLabel}
                              onChange={(e) => setNewFieldLabel(e.target.value)}
                              placeholder="ej: Teléfono"
                              className="w-full rounded bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-xs text-white"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">Tipo BD</label>
                            <select
                              value={newFieldType}
                              onChange={(e) => setNewFieldType(e.target.value as FieldDefinition['type'])}
                              className="w-full rounded bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-xs text-white"
                            >
                              <option value="string">string (VARCHAR)</option>
                              <option value="text">text (TEXT)</option>
                              <option value="integer">integer (INT)</option>
                              <option value="decimal">decimal (12,2)</option>
                              <option value="boolean">boolean (BOOL)</option>
                              <option value="date">date (DATE)</option>
                              <option value="enum">enum (ENUM)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">Widget Visual</label>
                            <select
                              value={newFieldWidget}
                              onChange={(e) =>
                                setNewFieldWidget(e.target.value as FieldDefinition['filamentWidget'])
                              }
                              className="w-full rounded bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-xs text-white"
                            >
                              <option value="TextInput">TextInput</option>
                              <option value="CurrencyInput">CurrencyInput</option>
                              <option value="DatePicker">DatePicker</option>
                              <option value="Toggle">Toggle</option>
                              <option value="Select">Select</option>
                              <option value="BadgeColumn">BadgeColumn</option>
                              <option value="RichEditor">RichEditor</option>
                            </select>
                          </div>
                          <button
                            type="submit"
                            className="py-1.5 px-3 rounded bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-amber-400 border border-slate-700 cursor-pointer"
                          >
                            + Añadir Campo
                          </button>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ===================================================================
              SECTION 3: CENTRO DE DECISIONES DEL CEO / SEO
              (EMAIL, TELÉFONO, LOGS & AUTO-CORRECCIÓN DE FRENTE DE TRABAJO)
             =================================================================== */}
          {activeSection === 'ceo_command' && (
            <div className="space-y-8 max-w-6xl">
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 border-b border-slate-800">
                <div className="space-y-2 max-w-2xl">
                  <div className="flex items-center gap-2 text-xs text-amber-400 font-medium">
                    <span> Supervisión Ejecutiva del Dueño (CEO / SEO)</span>
                    <span aria-hidden="true">·</span>
                    <span>Correo · Logs · Teléfono</span>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                    Centro de Decisiones del CEO y Auditoría de Auto-Corrección
                  </h1>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Todos los intercambios entre empleados IA, parches autónomos en su frente de trabajo y solicitudes de aprobación estratégica se notifican aquí al CEO ({config.ceoEmail} · {config.ceoPhone}).
                  </p>
                </div>

                {/* Interactive Filter Controls */}
                <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-md border border-slate-800">
                  {(
                    [
                      { id: 'all', label: 'Todos' },
                      { id: 'email', label: 'Correo' },
                      { id: 'phone', label: 'Teléfono' },
                      { id: 'log', label: 'Logs QA' },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setLogChannelFilter(tab.id)}
                      className={`px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
                        logChannelFilter === tab.id
                          ? 'bg-amber-500 text-slate-950 font-semibold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Direct CEO Directive Console to Any Agent */}
              <FrameworkMigrationAdvisorPanel
                config={config}
                setConfig={setConfig}
                onCeoVersionDecision={(ver, summary) => {
                  const nowStr = new Date().toTimeString().slice(0, 8);
                  setLogs((prev) => [
                    {
                      id: `log_ver_ceo_${Date.now()}`,
                      timestamp: nowStr,
                      fromAgent: 'architect_orchestrator',
                      toAgent: 'CEO_SEO',
                      channel: config.preferredChannels[0] || 'email',
                      severity: 'completed',
                      subject: `Decisión del CEO Aplicada: Ecosistema Sincronizado en Laravel ${ver}`,
                      detail: summary,
                      resolved: true,
                      ceoDecisionState: 'approved',
                    },
                    ...prev,
                  ]);
                }}
              />

              <form
                onSubmit={handleSendCeoDirective}
                className="p-5 rounded-lg border border-slate-800 bg-[#1E293B]/50 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold text-white">
                    Emitir Orden Ejecutiva Directa desde el Despacho del CEO a un Empleado IA
                  </h2>
                  <select
                    value={ceoTargetAgent}
                    onChange={(e) => setCeoTargetAgent(e.target.value as AgentId)}
                    className="rounded bg-slate-950 border border-slate-700 px-3 py-1.5 text-xs text-amber-300"
                  >
                    {agents.map((a) => (
                      <option key={a.id} value={a.id}>
                        Dirigir a: {a.name} — {a.roleTitle}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={ceoDirectiveInput}
                    onChange={(e) => setCeoDirectiveInput(e.target.value)}
                    placeholder="Ej: Sabrina Nova, optimiza los recursos Filament para exportar reportes PDF/CSV y verifica índices en PostgreSQL..."
                    className="flex-1 rounded-md bg-slate-950 border border-slate-800 px-3.5 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isSendingDirective}
                    className="px-4 py-2 rounded-md bg-amber-500 text-slate-950 font-semibold text-xs hover:bg-amber-400 transition-colors flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {isSendingDirective ? 'Consultando Agente...' : 'Enviar Orden del CEO'}
                  </button>
                </div>
              </form>

              {/* Feed of Agent Communications, Self-Healing Patches & CEO Decisions */}
              <div className="space-y-3">
                {filteredLogs.map((item) => (
                  <div
                    key={item.id}
                    className="p-5 rounded-lg border border-slate-800 bg-[#1E293B]/30 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                      <div className="flex items-center gap-2">
                        <span className="font-mono tabular-nums text-slate-300">{item.timestamp}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-medium text-amber-400">Vía {item.channel.toUpperCase()}</span>
                        <span aria-hidden="true">·</span>
                        <span>
                          De: <strong className="text-slate-200">{item.fromAgent}</strong> → Para:{' '}
                          <strong className="text-slate-200">{item.toAgent}</strong>
                        </span>
                      </div>

                      <div className="font-mono text-xs">
                        {item.severity === 'self_heal' && (
                          <span className="text-emerald-400">✓ Auto-Corrección Aplicada</span>
                        )}
                        {item.severity === 'ceo_decision' && item.ceoDecisionState === 'pending' && (
                          <span className="text-amber-400">● Requiere Decisión del CEO</span>
                        )}
                        {item.ceoDecisionState === 'approved' && (
                          <span className="text-emerald-400">✓ Aprobado por el CEO</span>
                        )}
                      </div>
                    </div>

                    <h3 className="text-sm font-semibold text-white">{item.subject}</h3>
                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{item.detail}</p>

                    {item.codePatch && (
                      <pre className="p-3 rounded bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-300 overflow-x-auto">
                        {item.codePatch}
                      </pre>
                    )}

                    {item.ceoDecisionState === 'pending' && (
                      <div className="pt-2 flex items-center gap-3">
                        <button
                          onClick={() => handleCeoDecision(item.id, 'approved')}
                          className="px-3.5 py-1.5 rounded bg-emerald-500 text-slate-950 font-semibold text-xs hover:bg-emerald-400 transition-colors cursor-pointer"
                        >
                          Aprobar Decisión Ejecutiva
                        </button>
                        <button
                          onClick={() => handleCeoDecision(item.id, 'modified')}
                          className="px-3.5 py-1.5 rounded border border-slate-700 bg-slate-900 text-slate-200 text-xs hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          Solicitar Ajuste al Agente
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===================================================================
              SECTION 4: INSPECTOR DE CÓDIGO FUENTE GENERADO
              (PYTHON LANGGRAPH + LARAVEL + REACT + INERTIA + FILAMENT PHP)
             =================================================================== */}
          {activeSection === 'code_inspector' && (
            <div className="space-y-6 max-w-6xl">
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">
                    Explorador del Código Generado por el Enjambre
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">
                    Inspeccione cada archivo del motor Python + LangGraph y del sistema Laravel {config.laravelVersion} + React + Inertia + Tailwind + Filament PHP v3 antes de exportarlo en ZIP.
                  </p>
                </div>

                <button
                  onClick={handleDownloadZipBundle}
                  className="px-4 py-2 rounded-md bg-amber-500 text-slate-950 font-semibold text-xs hover:bg-amber-400 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Descargar Todo en .ZIP ({generatedFiles.length} archivos)
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* File Tree Sidebar */}
                <div className="rounded-lg border border-slate-800 bg-[#1E293B]/30 p-4 space-y-2 max-h-[640px] overflow-y-auto">
                  <p className="text-xs font-semibold text-slate-300 pb-2 border-b border-slate-800">
                    Árbol de Archivos del Proyecto
                  </p>
                  {generatedFiles.map((file) => (
                    <button
                      key={file.path}
                      onClick={() => setSelectedFilePath(file.path)}
                      className={`w-full text-left px-3 py-2 rounded text-xs font-mono transition-colors cursor-pointer block truncate ${
                        currentCodeFile.path === file.path
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900'
                      }`}
                      title={file.path}
                    >
                      {file.path}
                    </button>
                  ))}
                </div>

                {/* Code Viewer */}
                <div className="lg:col-span-2 rounded-lg border border-slate-800 bg-slate-950 flex flex-col overflow-hidden">
                  <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-mono text-amber-400 truncate">{currentCodeFile.path}</div>
                      <div className="text-xs text-slate-400 truncate">{currentCodeFile.description}</div>
                    </div>
                    <button
                      onClick={() => handleCopyCode(currentCodeFile.content)}
                      className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 flex items-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      {copiedFile ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedFile ? 'Copiado' : 'Copiar Código'}
                    </button>
                  </div>
                  <pre className="p-5 text-xs font-mono text-slate-200 overflow-x-auto max-h-[560px] leading-relaxed">
                    {currentCodeFile.content}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================
              SECTION 5: LOS 3 MANUALES PASO A PASO POR SEPARADO & EXPORTACIÓN
              (XAMPP v3.3.0 LOCAL Y FTP REMOTO EN WINDOWS Y LINUX DEBIAN)
             =================================================================== */}
          {activeSection === 'manuals_deploy' && (
            <div className="space-y-8 max-w-6xl">
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 border-b border-slate-800">
                <div className="space-y-2 max-w-2xl">
                  <div className="flex items-center gap-2 text-xs text-amber-400 font-medium">
                    <span>Documentación Oficial por Separado</span>
                    <span aria-hidden="true">·</span>
                    <span>XAMPP v3.3.0 Local & FTP Remoto</span>
                    <span aria-hidden="true">·</span>
                    <span>Windows & Linux Debian</span>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                    Manuales Paso a Paso y Centro de Exportación (.ZIP / XAMPP / FTP)
                  </h1>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Acceda y descargue por separado los <strong>3 Manuales Oficiales</strong> generados para su empresa virtual y ejecute el empaquetado final hacia servidor local <strong>XAMPP v3.3.0</strong> o servidor remoto vía <strong>FTP</strong>.
                  </p>
                </div>
              </div>

              {/* Automated Pre-Flight Version Checker & Tool Installer for Final Product */}
              <AutoToolchainProvisionerPanel
                config={config}
                onReportToCeo={(subject, detail, isResolved) => {
                  const nowStr = new Date().toTimeString().slice(0, 8);
                  setLogs((prev) => [
                    {
                      id: `log_auto_deploy_${Date.now()}`,
                      timestamp: nowStr,
                      fromAgent: 'packager_deployer',
                      toAgent: 'CEO_SEO',
                      channel: config.preferredChannels[0] || 'email',
                      severity: isResolved ? 'completed' : 'ceo_decision',
                      subject,
                      detail,
                      resolved: isResolved,
                      ceoDecisionState: isResolved ? 'approved' : 'pending',
                    },
                    ...prev,
                  ]);
                }}
              />

              {/* XAMPP v3.3.0 Local & Remote FTP Deployment Panel */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-6 rounded-lg border border-slate-800 bg-[#1E293B]/40 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold text-white flex items-center gap-2">
                      <Server className="w-4 h-4 text-amber-400" />
                      Servidor Local XAMPP v3.3.0 (Windows & Debian)
                    </h2>
                    <span className="text-xs font-mono text-emerald-400">Sin Docker</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Ruta XAMPP Windows (v3.3.0)</label>
                      <input
                        type="text"
                        value={config.xamppPathWindows}
                        onChange={(e) => setConfig({ ...config, xamppPathWindows: e.target.value })}
                        className="w-full rounded bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs font-mono text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Ruta LAMPP Linux Debian</label>
                      <input
                        type="text"
                        value={config.xamppPathLinux}
                        onChange={(e) => setConfig({ ...config, xamppPathLinux: e.target.value })}
                        className="w-full rounded bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs font-mono text-white"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => {
                        setDeployStatusMsg(
                          `Script de despliegue local XAMPP v3.3.0 verificado para ${config.xamppPathWindows}\\${config.projectSlug} y ${config.xamppPathLinux}/${config.projectSlug}.`
                        );
                        handleDownloadZipBundle();
                      }}
                      className="px-4 py-2 rounded bg-amber-500 text-slate-950 font-semibold text-xs hover:bg-amber-400 transition-colors cursor-pointer"
                    >
                      Empaquetar ZIP para XAMPP v3.3.0
                    </button>
                  </div>
                </div>

                <div className="p-6 rounded-lg border border-slate-800 bg-[#1E293B]/40 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold text-white flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-amber-400" />
                      Servidor Remoto vía FTP / FTPS
                    </h2>
                    <span className="text-xs font-mono text-slate-400">deployer_ftp_xampp.py</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Servidor FTP Host</label>
                      <input
                        type="text"
                        value={config.ftpHost}
                        onChange={(e) => setConfig({ ...config, ftpHost: e.target.value })}
                        className="w-full rounded bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs font-mono text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Usuario FTP</label>
                      <input
                        type="text"
                        value={config.ftpUser}
                        onChange={(e) => setConfig({ ...config, ftpUser: e.target.value })}
                        className="w-full rounded bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs font-mono text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Directorio Remoto</label>
                      <input
                        type="text"
                        value={config.ftpRemoteDir}
                        onChange={(e) => setConfig({ ...config, ftpRemoteDir: e.target.value })}
                        className="w-full rounded bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs font-mono text-white"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => {
                        setDeployStatusMsg(
                          `Manifiesto FTP configurado hacia ${config.ftpHost}:${config.ftpPort}${config.ftpRemoteDir}. Descargando paquete ZIP listo para transferencia...`
                        );
                        handleDownloadZipBundle();
                      }}
                      className="px-4 py-2 rounded border border-amber-500/60 bg-amber-500/10 text-amber-300 font-semibold text-xs hover:bg-amber-500/20 transition-colors cursor-pointer"
                    >
                      Generar ZIP + Script FTP Remoto
                    </button>
                  </div>
                </div>
              </div>

              {(deployStatusMsg || zipReceipt) && (
                <div className="p-4 rounded-md border border-emerald-500/40 bg-emerald-950/20 text-emerald-200 text-xs font-mono flex flex-wrap items-center justify-between gap-2">
                  <span>
                    ✓ {deployStatusMsg || `Archivo ${zipReceipt?.fileName} generado con éxito.`}
                  </span>
                  {zipReceipt && (
                    <span className="tabular-nums">
                      {zipReceipt.fileCount} archivos · {(zipReceipt.byteSize / 1024).toFixed(1)} KB · {zipReceipt.timestamp}
                    </span>
                  )}
                </div>
              )}

              {/* Selector for the 3 Separate Manuals */}
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    {[
                      {
                        path: 'docs/01_MANUAL_USUARIO_PRODUCTO_Y_EMPRESA_IA.md',
                        title: 'Manual 1: Producto Final y Empresa IA',
                      },
                      {
                        path: 'docs/02_MANUAL_INSTALACION_HERRAMIENTAS_PRODUCCION.md',
                        title: 'Manual 2: Instalación Herramientas Producción (Win / Debian)',
                      },
                      {
                        path: 'docs/03_MANUAL_EXPORTACION_NUEVA_PC_XAMPP_Y_FTP.md',
                        title: 'Manual 3: Exportación Nueva PC (XAMPP v3.3.0 & FTP)',
                      },
                      {
                        path: 'docs/04_MANUAL_RESOLUCION_ERRORES_NAVEGADOR_Y_ACCESO.md',
                        title: 'Manual 4: Errores Navegador, Sintaxis y Acceso Web',
                      },
                    ].map((m) => (
                      <button
                        key={m.path}
                        onClick={() => setSelectedManualPath(m.path)}
                        className={`px-3.5 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                          selectedManualPath === m.path
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800'
                        }`}
                      >
                        {m.title}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() =>
                      handleDownloadSingleManual(currentManualFile.path, currentManualFile.content)
                    }
                    className="px-3.5 py-2 rounded-md border border-slate-700 bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-200 flex items-center gap-2 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Descargar este Manual por Separado (.MD)
                  </button>
                </div>

                <div className="p-6 rounded-lg border border-slate-800 bg-slate-950">
                  <pre className="text-xs font-mono text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {currentManualFile.content}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
