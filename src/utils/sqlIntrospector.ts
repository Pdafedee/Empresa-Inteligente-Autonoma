import { CrudEntity, CustomSavedQuery, EntityRelationship, FieldDefinition } from '../types/swarm';

export const SAMPLE_EXISTING_SQL_SCHEMAS: Record<string, { label: string; engine: 'mysql' | 'pgsql' | 'sqlite'; dbName: string; sql: string }> = {
  legacy_comercial_mysql: {
    label: 'BD Existente MySQL: Sistema Comercial & Facturación (Tablas Legacy con PK personalizadas y Relaciones)',
    engine: 'mysql',
    dbName: 'bd_comercial_existente',
    sql: `-- ESQUEMA EXISTENTE EN PRODUCCIÓN (MySQL / MariaDB XAMPP v3.3.0)
CREATE TABLE tbl_clientes_corporativos (
  id_cliente INT AUTO_INCREMENT PRIMARY KEY,
  codigo_fiscal VARCHAR(30) NOT NULL,
  razon_social VARCHAR(180) NOT NULL,
  correo_contacto VARCHAR(120) NOT NULL,
  cupo_credito DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  estado_cuenta ENUM('ACTIVO', 'MOROSO', 'SUSPENDIDO') NOT NULL DEFAULT 'ACTIVO',
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL
);

CREATE TABLE tbl_facturas_emitidas (
  id_factura INT AUTO_INCREMENT PRIMARY KEY,
  id_cliente INT NOT NULL,
  numero_comprobante VARCHAR(45) NOT NULL,
  fecha_emision DATE NOT NULL,
  monto_neto DECIMAL(12,2) NOT NULL,
  impuesto_iva DECIMAL(12,2) NOT NULL,
  pagada TINYINT(1) NOT NULL DEFAULT 0,
  CONSTRAINT fk_factura_cliente FOREIGN KEY (id_cliente) REFERENCES tbl_clientes_corporativos(id_cliente) ON DELETE CASCADE
);

CREATE TABLE tbl_pagos_recibidos (
  id_pago INT AUTO_INCREMENT PRIMARY KEY,
  id_factura INT NOT NULL,
  referencia_bancaria VARCHAR(80) NOT NULL,
  monto_abonado DECIMAL(12,2) NOT NULL,
  fecha_pago DATE NOT NULL,
  metodo_pago ENUM('TRANSFERENCIA', 'TARJETA', 'EFECTIVO') NOT NULL,
  CONSTRAINT fk_pago_factura FOREIGN KEY (id_factura) REFERENCES tbl_facturas_emitidas(id_factura) ON DELETE CASCADE
);

-- CONSULTAS DE NEGOCIO EXISTENTES A RESPETAR EN ELOQUENT Y FILAMENT:
-- QUERY 1: Cartera vencida por cliente con JOIN
SELECT c.id_cliente, c.razon_social, COUNT(f.id_factura) AS total_facturas_pendientes, SUM(f.monto_neto + f.impuesto_iva) AS deuda_total
FROM tbl_clientes_corporativos c
INNER JOIN tbl_facturas_emitidas f ON f.id_cliente = c.id_cliente
WHERE f.pagada = 0
GROUP BY c.id_cliente, c.razon_social;
`
  },
  hospital_pgsql: {
    label: 'BD Existente PostgreSQL: Sistema Hospitalario & Expedientes Clínicos',
    engine: 'pgsql',
    dbName: 'db_hospital_central',
    sql: `-- ESQUEMA EXISTENTE EN POSTGRESQL 16
CREATE TABLE med_especialistas (
  id_medico SERIAL PRIMARY KEY,
  matricula_profesional VARCHAR(40) NOT NULL,
  nombre_completo VARCHAR(160) NOT NULL,
  especialidad VARCHAR(100) NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE med_pacientes (
  id_paciente SERIAL PRIMARY KEY,
  documento_identidad VARCHAR(30) NOT NULL,
  nombre_paciente VARCHAR(160) NOT NULL,
  fecha_nacimiento DATE NOT NULL,
  grupo_sanguineo VARCHAR(10) NOT NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL
);

CREATE TABLE med_consultas_clinicas (
  id_consulta SERIAL PRIMARY KEY,
  id_paciente INT NOT NULL,
  id_medico INT NOT NULL,
  fecha_consulta DATE NOT NULL,
  diagnostico_cie10 TEXT NOT NULL,
  costo_consulta DECIMAL(10,2) NOT NULL,
  urgencia BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT fk_consulta_paciente FOREIGN KEY (id_paciente) REFERENCES med_pacientes(id_paciente),
  CONSTRAINT fk_consulta_medico FOREIGN KEY (id_medico) REFERENCES med_especialistas(id_medico)
);

-- CONSULTA EXISTENTE: Historial completo por paciente y médico
SELECT q.id_consulta, p.nombre_paciente, m.nombre_completo AS medico, m.especialidad, q.fecha_consulta, q.diagnostico_cie10
FROM med_consultas_clinicas q
JOIN med_pacientes p ON p.id_paciente = q.id_paciente
JOIN med_especialistas m ON m.id_medico = q.id_medico;
`
  },
  logistica_sqlite: {
    label: 'BD Existente SQLite: Almacén, Proveedores & Movimientos de Kárdex',
    engine: 'sqlite',
    dbName: 'database/kardex_existente.sqlite',
    sql: `-- ESQUEMA EXISTENTE EN SQLITE 3
CREATE TABLE alm_proveedores (
  cod_proveedor INTEGER PRIMARY KEY AUTOINCREMENT,
  ruc_empresa VARCHAR(25) NOT NULL,
  nombre_comercial VARCHAR(150) NOT NULL,
  telefono VARCHAR(40),
  calificacion_calidad INTEGER NOT NULL DEFAULT 5
);

CREATE TABLE alm_articulos (
  cod_articulo INTEGER PRIMARY KEY AUTOINCREMENT,
  cod_proveedor INTEGER NOT NULL,
  codigo_barras VARCHAR(60) NOT NULL,
  descripcion_articulo VARCHAR(200) NOT NULL,
  stock_actual INTEGER NOT NULL DEFAULT 0,
  costo_unitario DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (cod_proveedor) REFERENCES alm_proveedores(cod_proveedor)
);

SELECT a.cod_articulo, a.descripcion_articulo, a.stock_actual, p.nombre_comercial
FROM alm_articulos a
INNER JOIN alm_proveedores p ON p.cod_proveedor = a.cod_proveedor
WHERE a.stock_actual <= 10;
`
  }
};

function toPascalCase(snake: string): string {
  // Remove common prefixes like tbl_, med_, alm_ for cleaner class names while keeping exact tableName
  const cleaned = snake.replace(/^(tbl_|cat_|med_|alm_|sis_)/i, '');
  return cleaned
    .split('_')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('');
}

function toHumanLabel(snake: string): string {
  return snake
    .split('_')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function parseSqlSchemaToEntities(sqlText: string): CrudEntity[] {
  const entities: CrudEntity[] = [];
  const createTableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"']?([a-zA-Z0-9_]+)[`"']?\s*\(([\s\S]*?)\);/gi;

  // Extract SELECT queries to preserve them as Eloquent Scopes / Custom Queries
  const selectQueries: string[] = [];
  const selectRegex = /(SELECT\s+[\s\S]*?;)/gi;
  let selMatch: RegExpExecArray | null;
  while ((selMatch = selectRegex.exec(sqlText)) !== null) {
    selectQueries.push(selMatch[1].trim());
  }

  let match: RegExpExecArray | null;
  let tableIdx = 0;

  while ((match = createTableRegex.exec(sqlText)) !== null) {
    tableIdx++;
    const rawTableName = match[1].trim();
    const body = match[2];

    const lines = body
      .split(/\r?\n/)
      .map((l) => l.trim().replace(/,$/, ''))
      .filter((l) => l && !l.startsWith('--'));

    let primaryKey = 'id';
    let hasCreatedAt = false;
    let hasUpdatedAt = false;

    const fields: FieldDefinition[] = [];
    const relationships: EntityRelationship[] = [];
    const fkMap: Record<string, { refTable: string; refCol: string }> = {};

    // First pass: look for FOREIGN KEY constraints
    for (const line of lines) {
      const fkRegex = /FOREIGN\s+KEY\s*\([`"']?([a-zA-Z0-9_]+)[`"']?\)\s*REFERENCES\s+[`"']?([a-zA-Z0-9_]+)[`"']?\s*\([`"']?([a-zA-Z0-9_]+)[`"']?\)/i;
      const fkMatch = line.match(fkRegex);
      if (fkMatch) {
        fkMap[fkMatch[1]] = {
          refTable: fkMatch[2],
          refCol: fkMatch[3],
        };
      }
      const pkConstraint = line.match(/^PRIMARY\s+KEY\s*\([`"']?([a-zA-Z0-9_]+)[`"']?\)/i);
      if (pkConstraint) {
        primaryKey = pkConstraint[1];
      }
    }

    // Second pass: parse columns
    let fieldIdx = 0;
    for (const line of lines) {
      if (/^(CONSTRAINT|PRIMARY\s+KEY|FOREIGN\s+KEY|UNIQUE|INDEX|KEY)\b/i.test(line)) {
        continue;
      }

      const colMatch = line.match(/^[`"']?([a-zA-Z0-9_]+)[`"']?\s+([A-Za-z0-9_]+(?:\s*\([^)]+\))?)(.*)$/);
      if (!colMatch) continue;

      const colName = colMatch[1];
      const colTypeRaw = colMatch[2].toUpperCase();
      const restFlags = colMatch[3].toUpperCase();

      if (colName.toLowerCase() === 'created_at') {
        hasCreatedAt = true;
        continue;
      }
      if (colName.toLowerCase() === 'updated_at' || colName.toLowerCase() === 'deleted_at') {
        if (colName.toLowerCase() === 'updated_at') hasUpdatedAt = true;
        continue;
      }

      if (restFlags.includes('PRIMARY KEY') || colTypeRaw.includes('SERIAL')) {
        primaryKey = colName;
        continue;
      }

      fieldIdx++;
      const isNullable = restFlags.includes('NULL') && !restFlags.includes('NOT NULL');

      let fieldType: FieldDefinition['type'] = 'string';
      let widget: FieldDefinition['filamentWidget'] = 'TextInput';
      let enumOptions: string[] | undefined;

      if (fkMap[colName]) {
        fieldType = 'foreignId';
        widget = 'Select';
      } else if (colTypeRaw.startsWith('ENUM')) {
        fieldType = 'enum';
        widget = 'BadgeColumn';
        const inner = colTypeRaw.match(/\((.*)\)/);
        if (inner) {
          enumOptions = inner[1]
            .split(',')
            .map((s) => s.trim().replace(/^['"]|['"]$/g, ''));
        }
      } else if (colTypeRaw.includes('TINYINT(1)') || colTypeRaw.includes('BOOL')) {
        fieldType = 'boolean';
        widget = 'Toggle';
      } else if (colTypeRaw.includes('DECIMAL') || colTypeRaw.includes('NUMERIC') || colTypeRaw.includes('FLOAT')) {
        fieldType = 'decimal';
        widget = 'CurrencyInput';
      } else if (colTypeRaw.includes('INT')) {
        fieldType = 'integer';
        widget = 'TextInput';
      } else if (colTypeRaw.includes('DATE') || colTypeRaw.includes('TIME')) {
        fieldType = 'date';
        widget = 'DatePicker';
      } else if (colTypeRaw.includes('TEXT')) {
        fieldType = 'text';
        widget = 'RichEditor';
      }

      fields.push({
        id: `f_intro_${tableIdx}_${fieldIdx}`,
        name: colName,
        label: toHumanLabel(colName),
        type: fieldType,
        required: !isNullable,
        searchable: fieldType === 'string' || fieldType === 'enum' || fieldType === 'text',
        sortable: true,
        filamentWidget: widget,
        enumOptions,
        foreignTable: fkMap[colName]?.refTable,
        foreignKeyColumn: fkMap[colName]?.refCol,
      });

      if (fkMap[colName]) {
        const refTable = fkMap[colName].refTable;
        const refCol = fkMap[colName].refCol;
        const relatedModel = toPascalCase(refTable);
        relationships.push({
          id: `rel_${tableIdx}_${fieldIdx}`,
          type: 'belongsTo',
          methodName: relatedModel.charAt(0).toLowerCase() + relatedModel.slice(1),
          relatedModel,
          relatedTable: refTable,
          foreignKey: colName,
          ownerKey: refCol,
          displayColumn: 'id',
        });
      }
    }

    const pascalName = toPascalCase(rawTableName);
    const singularName = pascalName.endsWith('s') && pascalName.length > 4 ? pascalName.slice(0, -1) : pascalName;
    const pluralName = pascalName.endsWith('s') ? pascalName : `${pascalName}s`;

    // Attach custom queries that reference this table
    const matchingQueries: CustomSavedQuery[] = selectQueries
      .filter((q) => q.toLowerCase().includes(rawTableName.toLowerCase()))
      .map((q, qIdx) => ({
        id: `q_${tableIdx}_${qIdx + 1}`,
        name: `consultaExistente${qIdx + 1}`,
        description: `Consulta SQL nativa respetada sobre ${rawTableName}`,
        sqlOrEloquent: q,
      }));

    entities.push({
      id: `ent_existing_${tableIdx}`,
      name: singularName,
      pluralName,
      tableName: rawTableName,
      primaryKey,
      hasTimestamps: hasCreatedAt && hasUpdatedAt,
      isFromExistingDb: true,
      icon: 'Database',
      description: `Tabla existente '${rawTableName}' (PK: ${primaryKey}) importada con su estructura y relaciones intactas.`,
      enableExportCsv: true,
      enableSoftDeletes: false,
      scaffolderMode: 'filament_craftable_nova',
      fields,
      relationships,
      customQueries: matchingQueries,
    });
  }

  // Third pass: Populate inverse hasMany relationships and best displayColumn on parent tables
  for (const childEnt of entities) {
    for (const rel of childEnt.relationships) {
      if (rel.type === 'belongsTo') {
        const parentEnt = entities.find((e) => e.tableName.toLowerCase() === rel.relatedTable.toLowerCase());
        if (parentEnt) {
          // Pick first string column of parent as displayColumn for Filament Select & Inertia joins
          const firstStringField = parentEnt.fields.find((f) => f.type === 'string');
          if (firstStringField) {
            rel.displayColumn = firstStringField.name;
            const matchingField = childEnt.fields.find((f) => f.name === rel.foreignKey);
            if (matchingField) {
              matchingField.foreignDisplayColumn = firstStringField.name;
            }
          }
          // Add inverse hasMany on parent if not already added
          const inverseMethod = childEnt.pluralName.charAt(0).toLowerCase() + childEnt.pluralName.slice(1);
          const alreadyExists = parentEnt.relationships.some(
            (r) => r.methodName === inverseMethod && r.relatedTable === childEnt.tableName
          );
          if (!alreadyExists) {
            parentEnt.relationships.push({
              id: `rel_inv_${parentEnt.id}_${childEnt.id}`,
              type: 'hasMany',
              methodName: inverseMethod,
              relatedModel: childEnt.name,
              relatedTable: childEnt.tableName,
              foreignKey: rel.foreignKey,
              ownerKey: parentEnt.primaryKey,
              displayColumn: childEnt.primaryKey,
            });
          }
        }
      }
    }
  }

  return entities;
}
