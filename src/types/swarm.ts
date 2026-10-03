export type DatabaseEngine = 'mysql' | 'pgsql' | 'sqlite';

export type DatabaseProvisioningMode = 'new_from_scratch' | 'existing_introspect';

export type LaravelVersion = '9.x' | '10.x' | '11.x';

export type FrameworkMigrationMode = 'keep_laravel_9' | 'migrate_9_to_10' | 'migrate_9_to_11' | 'native_modern';

export interface EcosystemVersionMatrix {
  phpVersion: string;
  laravelPackage: string;
  reactVersion: string;
  inertiaLaravelVersion: string;
  inertiaReactVersion: string;
  tailwindVersion: string;
  viteVersion: string;
  laravelVitePlugin: string;
  filamentVersion: string;
  infyomBranch: string;
  middlewareArchitecture: 'http_kernel_classic' | 'bootstrap_app_modern';
}

export type NotificationChannel = 'email' | 'phone' | 'log';

export type AgentId =
  | 'architect_orchestrator'
  | 'db_migrations'
  | 'security_rbac'
  | 'scaffolder_reverse'
  | 'visual_master_filament'
  | 'qa_self_healing'
  | 'packager_deployer'
  | 'frontend_architect_inertia';

export type DashboardTheme = 'filament_enterprise' | 'larafast_saas' | 'craftable_pro';

export type AgentStatus = 'idle' | 'working' | 'communicating' | 'healing_error' | 'awaiting_ceo' | 'completed';

export interface EntityRelationship {
  id: string;
  type: 'belongsTo' | 'hasMany' | 'hasOne' | 'belongsToMany';
  methodName: string; // e.g., "customer", "invoices"
  relatedModel: string; // e.g., "Customer", "Invoice"
  relatedTable: string; // e.g., "customers", "invoices"
  foreignKey: string; // e.g., "customer_id", "id_cliente"
  ownerKey: string; // e.g., "id", "id_cliente"
  displayColumn: string; // e.g., "company_name", "nombre_completo"
}

export interface CustomSavedQuery {
  id: string;
  name: string; // e.g., "withOverdueBalance", "activosConCredito"
  description: string;
  sqlOrEloquent: string; // e.g., "SELECT * FROM ... WHERE ..." or Eloquent scope
}

export interface FieldDefinition {
  id: string;
  name: string;
  label: string;
  type: 'string' | 'text' | 'integer' | 'decimal' | 'boolean' | 'date' | 'enum' | 'foreignId';
  required: boolean;
  searchable: boolean;
  sortable: boolean;
  filamentWidget: 'TextInput' | 'RichEditor' | 'Select' | 'Toggle' | 'DatePicker' | 'CurrencyInput' | 'BadgeColumn';
  enumOptions?: string[];
  foreignTable?: string;
  foreignKeyColumn?: string; // e.g. "id" or "id_cliente"
  foreignDisplayColumn?: string; // e.g. "company_name"
}

export interface CrudEntity {
  id: string;
  name: string; // e.g., "Project", "Invoice", "Customer"
  pluralName: string; // e.g., "Projects"
  tableName: string; // Exact table name in DB, e.g., "tbl_clientes" or "customers"
  primaryKey: string; // Exact PK column in DB, e.g., "id" or "id_cliente"
  hasTimestamps: boolean; // Whether table uses created_at / updated_at
  isFromExistingDb?: boolean;
  icon: string;
  description: string;
  enableExportCsv: boolean;
  enableSoftDeletes: boolean;
  scaffolderMode: 'larafast_inertia' | 'infyom_schema' | 'filament_craftable_nova';
  fields: FieldDefinition[];
  relationships: EntityRelationship[];
  customQueries: CustomSavedQuery[];
}

export interface CompanyConfig {
  companyName: string;
  slogan: string;
  ceoName: string;
  ceoEmail: string;
  ceoPhone: string;
  preferredChannels: NotificationChannel[];
  projectName: string;
  projectSlug: string;
  projectDescription: string;
  laravelVersion: LaravelVersion;
  migrationMode: FrameworkMigrationMode;
  versionMatrix: EcosystemVersionMatrix;
  databaseEngine: DatabaseEngine;
  dbProvisioningMode: DatabaseProvisioningMode;
  existingDbPrefix: string;
  respectLegacyConstraints: boolean;
  dbHost: string;
  dbPort: string;
  dbName: string;
  dbUser: string;
  authRoles: string[];
  visualGeneratorEngine: 'filament_v3_hybrid' | 'craftable_pro_adapter' | 'nova_inertia_bridge';
  preferredDashboardTheme?: DashboardTheme;
  deployTarget: 'xampp_local' | 'ftp_remote' | 'both';
  xamppPathWindows: string;
  xamppPathLinux: string;
  ftpHost: string;
  ftpPort: string;
  ftpUser: string;
  ftpRemoteDir: string;
  osTarget: 'windows_11' | 'debian_12' | 'dual_os';
}

export interface AgentEmployee {
  id: AgentId;
  name: string;
  roleTitle: string;
  specialty: string;
  methodology: string;
  toolsUsed: string[];
  status: AgentStatus;
  progress: number;
  selfHealedCount: number;
  currentTask: string;
  perfectedBadge?: boolean;
}

export interface SwarmLogMessage {
  id: string;
  timestamp: string;
  fromAgent: AgentId;
  toAgent: AgentId | 'CEO_SEO';
  channel: NotificationChannel;
  severity: 'info' | 'self_heal' | 'ceo_decision' | 'completed';
  subject: string;
  detail: string;
  codePatch?: string;
  resolved?: boolean;
  ceoDecisionState?: 'pending' | 'approved' | 'modified';
}

export interface GeneratedFile {
  path: string;
  category: 'python_langgraph' | 'laravel_backend' | 'react_inertia_spa' | 'filament_craftable_visual' | 'security_auth' | 'manuals';
  language: 'python' | 'php' | 'tsx' | 'json' | 'markdown' | 'env' | 'bash';
  description: string;
  generatedBy: AgentId;
  content: string;
}
