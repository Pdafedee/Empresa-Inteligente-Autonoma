import React, { useState } from 'react';
import { Database, Upload, CheckCircle2, Link2, Code2, Plus } from 'lucide-react';
import {
  CompanyConfig,
  CrudEntity,
  CustomSavedQuery,
  DatabaseProvisioningMode,
  EntityRelationship,
} from '../types/swarm';
import {
  parseSqlSchemaToEntities,
  SAMPLE_EXISTING_SQL_SCHEMAS,
} from '../utils/sqlIntrospector';

interface Props {
  config: CompanyConfig;
  setConfig: React.Dispatch<React.SetStateAction<CompanyConfig>>;
  entities: CrudEntity[];
  setEntities: React.Dispatch<React.SetStateAction<CrudEntity[]>>;
  selectedEntity: CrudEntity;
  setSelectedEntityId: (id: string) => void;
  onIntrospectionComplete: (summaryMsg: string, importedEntities: CrudEntity[]) => void;
}

export default function DatabaseIntrospectorPanel({
  config,
  setConfig,
  entities,
  setEntities,
  selectedEntity,
  setSelectedEntityId,
  onIntrospectionComplete,
}: Props) {
  const [sqlDumpInput, setSqlDumpInput] = useState<string>(
    SAMPLE_EXISTING_SQL_SCHEMAS.legacy_comercial_mysql.sql
  );
  const [introspectMessage, setIntrospectMessage] = useState<string | null>(null);

  // Form states for adding a new Relationship or Custom Query to the selected Entity
  const [relType, setRelType] = useState<'belongsTo' | 'hasMany'>('belongsTo');
  const [relMethod, setRelMethod] = useState('');
  const [relTargetTable, setRelTargetTable] = useState('');
  const [relFk, setRelFk] = useState('');
  const [relOwnerKey, setRelOwnerKey] = useState('id');

  const [queryName, setQueryName] = useState('');
  const [queryDesc, setQueryDesc] = useState('');
  const [querySql, setQuerySql] = useState('');

  const handleLoadSampleSchema = (key: string) => {
    const preset = SAMPLE_EXISTING_SQL_SCHEMAS[key];
    if (!preset) return;
    setSqlDumpInput(preset.sql);
    setConfig((prev) => ({
      ...prev,
      databaseEngine: preset.engine,
      dbName: preset.dbName,
      dbProvisioningMode: 'existing_introspect',
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = String(ev.target?.result || '');
      if (text) {
        setSqlDumpInput(text);
        setConfig((prev) => ({ ...prev, dbProvisioningMode: 'existing_introspect' }));
      }
    };
    reader.readAsText(file);
  };

  const handleRunSqlIntrospection = () => {
    const parsed = parseSqlSchemaToEntities(sqlDumpInput);
    if (parsed.length === 0) {
      setIntrospectMessage(
        'No se detectaron sentencias CREATE TABLE válidas. Verifique la sintaxis SQL.'
      );
      return;
    }

    setConfig((prev) => ({
      ...prev,
      dbProvisioningMode: 'existing_introspect',
      respectLegacyConstraints: true,
    }));
    setEntities(parsed);
    setSelectedEntityId(parsed[0].id);

    const totalRels = parsed.reduce((acc, e) => acc + (e.relationships?.length || 0), 0);
    const totalQueries = parsed.reduce((acc, e) => acc + (e.customQueries?.length || 0), 0);
    const msg = `Introspección completada: ${parsed.length} tablas existentes, ${totalRels} relaciones (belongsTo/hasMany) y ${totalQueries} consultas SQL nativas integradas al Generador Visual (Filament PHP + Craftable PRO + Nova + LaraFast + InfyOm).`;
    setIntrospectMessage(msg);
    onIntrospectionComplete(msg, parsed);
  };

  const handleAddRelationship = (e: React.FormEvent) => {
    e.preventDefault();
    if (!relMethod.trim() || !relTargetTable.trim() || !relFk.trim() || !selectedEntity) return;
    const cleanModel = relTargetTable
      .replace(/^(tbl_|med_|alm_)/i, '')
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join('');

    const newRel: EntityRelationship = {
      id: `rel_${Date.now()}`,
      type: relType,
      methodName: relMethod.trim(),
      relatedModel: cleanModel.endsWith('s') ? cleanModel.slice(0, -1) : cleanModel,
      relatedTable: relTargetTable.trim(),
      foreignKey: relFk.trim(),
      ownerKey: relOwnerKey.trim() || 'id',
      displayColumn: 'id',
    };

    setEntities((prev) =>
      prev.map((ent) =>
        ent.id === selectedEntity.id
          ? { ...ent, relationships: [...(ent.relationships || []), newRel] }
          : ent
      )
    );
    setRelMethod('');
    setRelTargetTable('');
    setRelFk('');
  };

  const handleAddCustomQuery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryName.trim() || !querySql.trim() || !selectedEntity) return;
    const newQ: CustomSavedQuery = {
      id: `q_${Date.now()}`,
      name: queryName.trim().replace(/\s+/g, '_'),
      description: queryDesc.trim() || `Consulta personalizada sobre ${selectedEntity.tableName}`,
      sqlOrEloquent: querySql.trim(),
    };

    setEntities((prev) =>
      prev.map((ent) =>
        ent.id === selectedEntity.id
          ? { ...ent, customQueries: [...(ent.customQueries || []), newQ] }
          : ent
      )
    );
    setQueryName('');
    setQueryDesc('');
    setQuerySql('');
  };

  return (
    <div className="space-y-6">
      {/* Mode Switcher: New DB vs Existing DB Introspection */}
      <div className="p-5 rounded-lg border border-slate-800 bg-[#1E293B]/50 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-amber-400" />
              Origen de la Base de Datos: Nueva vs. Ya Existente (Introspección Total)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Si selecciona una base de datos existente, el enjambre respeta su estructura, nombres de tablas, llaves primarias, consultas SQL y relaciones en el generador visual y en todo el sistema.
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-md border border-slate-800 shrink-0">
            {(
              [
                { id: 'existing_introspect', label: 'Usar BD Ya Existente (Respetar Estructura)' },
                { id: 'new_from_scratch', label: 'Crear BD Nueva desde Cero' },
              ] as Array<{ id: DatabaseProvisioningMode; label: string }>
            ).map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => setConfig((prev) => ({ ...prev, dbProvisioningMode: mode.id }))}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  config.dbProvisioningMode === mode.id
                    ? 'bg-amber-500 text-slate-950 font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        {/* SQL Dump / DDL Importer when Existing DB Mode is active */}
        {config.dbProvisioningMode === 'existing_introspect' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-400">Cargar Esquema Existente de Ejemplo:</span>
                <button
                  type="button"
                  onClick={() => handleLoadSampleSchema('legacy_comercial_mysql')}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-amber-300 cursor-pointer"
                >
                  MySQL: Comercial & Facturas (PK id_cliente)
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadSampleSchema('hospital_pgsql')}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-emerald-300 cursor-pointer"
                >
                  PostgreSQL: Hospital & Consultas
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadSampleSchema('logistica_sqlite')}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-sky-300 cursor-pointer"
                >
                  SQLite: Almacén & Kárdex
                </button>
              </div>

              <label className="px-3 py-1.5 rounded border border-slate-700 bg-slate-900 hover:bg-slate-800 text-xs text-slate-200 flex items-center gap-1.5 cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-amber-400" />
                Subir Archivo .SQL Existente
                <input type="file" accept=".sql,.txt" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            <textarea
              rows={7}
              value={sqlDumpInput}
              onChange={(e) => setSqlDumpInput(e.target.value)}
              placeholder="Pegue aquí el script SQL (CREATE TABLE ..., FOREIGN KEY ..., SELECT ... JOIN ...) de su base de datos existente..."
              className="w-full rounded-md bg-slate-950 border border-slate-800 p-3 text-xs font-mono text-slate-200 focus:border-amber-500 focus:outline-none"
            />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-400">
                Marco Silva (Agente BD) + Sabrina Nova (Generador Visual) extraerán tablas, llaves primarias, llaves foráneas y consultas SQL.
              </div>
              <button
                type="button"
                onClick={handleRunSqlIntrospection}
                className="px-4 py-2 rounded-md bg-amber-500 text-slate-950 font-semibold text-xs hover:bg-amber-400 transition-colors cursor-pointer"
              >
                Importar y Respetar Estructura, Relaciones y Consultas
              </button>
            </div>

            {introspectMessage && (
              <div className="p-3 rounded border border-emerald-500/40 bg-emerald-950/30 text-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{introspectMessage}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected Entity Table Metadata, Relationships & Preserved SQL Queries Editor */}
      {selectedEntity && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Table Settings & Relationships (belongsTo / hasMany) */}
          <div className="p-5 rounded-lg border border-slate-800 bg-[#1E293B]/40 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <Link2 className="w-4 h-4 text-amber-400" />
                Estructura de Tabla y Relaciones de {selectedEntity.name}
              </h4>
              <span className="text-xs font-mono text-slate-400">
                {(selectedEntity.relationships || []).length} relaciones
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Nombre Exacto Tabla</label>
                <input
                  type="text"
                  value={selectedEntity.tableName}
                  onChange={(e) =>
                    setEntities((prev) =>
                      prev.map((ent) =>
                        ent.id === selectedEntity.id ? { ...ent, tableName: e.target.value } : ent
                      )
                    )
                  }
                  className="w-full rounded bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-xs font-mono text-amber-300"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Llave Primaria ($primaryKey)</label>
                <input
                  type="text"
                  value={selectedEntity.primaryKey || 'id'}
                  onChange={(e) =>
                    setEntities((prev) =>
                      prev.map((ent) =>
                        ent.id === selectedEntity.id ? { ...ent, primaryKey: e.target.value } : ent
                      )
                    )
                  }
                  className="w-full rounded bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-xs font-mono text-emerald-300"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Usa Timestamps</label>
                <select
                  value={selectedEntity.hasTimestamps ? 'yes' : 'no'}
                  onChange={(e) =>
                    setEntities((prev) =>
                      prev.map((ent) =>
                        ent.id === selectedEntity.id
                          ? { ...ent, hasTimestamps: e.target.value === 'yes' }
                          : ent
                      )
                    )
                  }
                  className="w-full rounded bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-xs text-white"
                >
                  <option value="yes">Sí (created_at / updated_at)</option>
                  <option value="no">No ($timestamps = false)</option>
                </select>
              </div>
            </div>

            {/* Existing Relationships List */}
            <div className="space-y-2">
              {(selectedEntity.relationships || []).length === 0 ? (
                <p className="text-xs text-slate-400">
                  Sin relaciones registradas aún. Agregue una relación abajo o importe un SQL con llaves foráneas.
                </p>
              ) : (
                (selectedEntity.relationships || []).map((rel) => (
                  <div
                    key={rel.id}
                    className="p-2.5 rounded bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono"
                  >
                    <div>
                      <span className="text-amber-400">{rel.type}</span>{' '}
                      <span className="text-white">{rel.methodName}()</span> →{' '}
                      <span className="text-emerald-400">
                        {rel.relatedTable}.{rel.ownerKey}
                      </span>{' '}
                      <span className="text-slate-400">(FK: {rel.foreignKey})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setEntities((prev) =>
                          prev.map((ent) =>
                            ent.id === selectedEntity.id
                              ? {
                                  ...ent,
                                  relationships: (ent.relationships || []).filter((r) => r.id !== rel.id),
                                }
                              : ent
                          )
                        )
                      }
                      className="text-slate-500 hover:text-red-400 cursor-pointer"
                    >
                      Quitar
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add Relationship Form */}
            <form onSubmit={handleAddRelationship} className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 items-end">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Tipo</label>
                <select
                  value={relType}
                  onChange={(e) => setRelType(e.target.value as 'belongsTo' | 'hasMany')}
                  className="w-full rounded bg-slate-950 border border-slate-800 px-2 py-1.5 text-xs text-white"
                >
                  <option value="belongsTo">belongsTo</option>
                  <option value="hasMany">hasMany</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Método</label>
                <input
                  type="text"
                  value={relMethod}
                  onChange={(e) => setRelMethod(e.target.value)}
                  placeholder="customer"
                  className="w-full rounded bg-slate-950 border border-slate-800 px-2 py-1.5 text-xs font-mono text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Tabla Destino</label>
                <input
                  type="text"
                  value={relTargetTable}
                  onChange={(e) => setRelTargetTable(e.target.value)}
                  placeholder="tbl_customers"
                  className="w-full rounded bg-slate-950 border border-slate-800 px-2 py-1.5 text-xs font-mono text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Columna FK</label>
                <input
                  type="text"
                  value={relFk}
                  onChange={(e) => setRelFk(e.target.value)}
                  placeholder="id_customer"
                  className="w-full rounded bg-slate-950 border border-slate-800 px-2 py-1.5 text-xs font-mono text-white"
                  required
                />
              </div>
              <button
                type="submit"
                className="py-1.5 px-2.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-amber-400 border border-slate-700 cursor-pointer"
              >
                + Relación
              </button>
            </form>
          </div>

          {/* Right: Custom SQL Queries / Views Preserved in Model & Controller */}
          <div className="p-5 rounded-lg border border-slate-800 bg-[#1E293B]/40 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <Code2 className="w-4 h-4 text-amber-400" />
                Consultas SQL y Vistas Respetadas ({selectedEntity.tableName})
              </h4>
              <span className="text-xs font-mono text-slate-400">
                {(selectedEntity.customQueries || []).length} consultas
              </span>
            </div>

            <div className="space-y-2 max-h-44 overflow-y-auto">
              {(selectedEntity.customQueries || []).length === 0 ? (
                <p className="text-xs text-slate-400">
                  Agregue consultas SQL (SELECT / JOIN) propias de su base de datos existente para que el modelo Eloquent y el controlador Inertia las incluyan automáticamente.
                </p>
              ) : (
                (selectedEntity.customQueries || []).map((q) => (
                  <div
                    key={q.id}
                    className="p-3 rounded bg-slate-950 border border-slate-800 space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-semibold text-amber-300">
                        {selectedEntity.name}::ejecutar_{q.name}()
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setEntities((prev) =>
                            prev.map((ent) =>
                              ent.id === selectedEntity.id
                                ? {
                                    ...ent,
                                    customQueries: (ent.customQueries || []).filter(
                                      (item) => item.id !== q.id
                                    ),
                                  }
                                : ent
                            )
                          )
                        }
                        className="text-slate-500 hover:text-red-400 cursor-pointer"
                      >
                        Quitar
                      </button>
                    </div>
                    <p className="text-slate-400">{q.description}</p>
                    <pre className="text-[11px] font-mono text-emerald-300 overflow-x-auto pt-1">
                      {q.sqlOrEloquent}
                    </pre>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddCustomQuery} className="space-y-2.5 pt-2 border-t border-slate-800">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={queryName}
                  onChange={(e) => setQueryName(e.target.value)}
                  placeholder="Nombre método (ej: reporteDeudores)"
                  className="rounded bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-xs font-mono text-white"
                  required
                />
                <input
                  type="text"
                  value={queryDesc}
                  onChange={(e) => setQueryDesc(e.target.value)}
                  placeholder="Descripción de la consulta..."
                  className="rounded bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-xs text-white"
                />
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={querySql}
                  onChange={(e) => setQuerySql(e.target.value)}
                  placeholder={`SELECT * FROM ${selectedEntity.tableName} INNER JOIN ...`}
                  className="flex-1 rounded bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-xs font-mono text-white"
                  required
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-amber-400 border border-slate-700 flex items-center gap-1 whitespace-nowrap cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Guardar Consulta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
