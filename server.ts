import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '5mb' }));

function getGeminiClient() {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Endpoint 1: AI Swarm Architect & Visual Scaffolder Generator (Supports New or Existing DB)
app.post('/api/swarm/architect', async (req, res) => {
  try {
    const { prompt, companyName, databaseEngine, laravelVersion, dbProvisioningMode } = req.body;
    const ai = getGeminiClient();

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Eres Sabrina Ramonov liderando la empresa virtual de desarrollo de software "${companyName || 'Ramonov Swarm Studio'}" en Python + LangGraph (Enjambre Basado en Roles + Divide y Vencerás, sin Docker).
El CEO solicita diseñar y construir el siguiente sistema en Laravel ${laravelVersion || '11.x'} + React + Inertia.js + Tailwind CSS + Filament PHP / Craftable PRO / LaraFast / InfyOm con base de datos ${databaseEngine || 'mysql'} en modo "${dbProvisioningMode === 'existing_introspect' ? 'USAR BASE DE DATOS EXISTENTE (Respetando estructura, llaves primarias, relaciones y consultas SQL)' : 'CREAR BASE DE DATOS NUEVA'}":

Solicitud del CEO: "${prompt}"

Diseña entre 2 y 4 entidades CRUD completas y coherentes con sus llaves primarias (primaryKey), relaciones entre tablas (belongsTo / hasMany) y consultas SQL nativas conservadas, además de un resumen técnico ejecutivo y un registro de auto-corrección entre agentes.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            projectName: { type: Type.STRING, description: 'Nombre profesional del sistema a generar' },
            projectSlug: { type: Type.STRING, description: 'Slug en minúsculas con guiones bajos, ej: erp_clinica_pro' },
            projectDescription: { type: Type.STRING, description: 'Descripción concisa del sistema' },
            executiveSummary: { type: Type.STRING, description: 'Informe ejecutivo para el CEO/SEO' },
            selfHealingNote: {
              type: Type.STRING,
              description: 'Detalle técnico del error detectado y auto-corregido entre Marco Silva (BD), Aria Chen (QA) y Sabrina Nova (Filament/Craftable)',
            },
            entities: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: 'Nombre en singular PascalCase en inglés, ej: Invoice' },
                  pluralName: { type: Type.STRING, description: 'Nombre en plural PascalCase, ej: Invoices' },
                  tableName: { type: Type.STRING, description: 'Nombre exacto de la tabla en la BD, ej: tbl_invoices' },
                  primaryKey: { type: Type.STRING, description: 'Nombre de la columna llave primaria, ej: id o id_invoice' },
                  hasTimestamps: { type: Type.BOOLEAN, description: 'Si la tabla tiene created_at y updated_at' },
                  description: { type: Type.STRING, description: 'Propósito del módulo CRUD' },
                  scaffolderMode: {
                    type: Type.STRING,
                    description: 'Uno de: filament_craftable_nova, larafast_inertia, infyom_schema',
                  },
                  fields: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING, description: 'Nombre del campo snake_case' },
                        label: { type: Type.STRING, description: 'Etiqueta legible en español' },
                        type: {
                          type: Type.STRING,
                          description: 'Uno de: string, text, integer, decimal, boolean, date, enum, foreignId',
                        },
                        required: { type: Type.BOOLEAN },
                        searchable: { type: Type.BOOLEAN },
                        sortable: { type: Type.BOOLEAN },
                        filamentWidget: {
                          type: Type.STRING,
                          description: 'Uno de: TextInput, RichEditor, Select, Toggle, DatePicker, CurrencyInput, BadgeColumn',
                        },
                        foreignTable: { type: Type.STRING, description: 'Tabla referenciada si es foreignId' },
                        foreignKeyColumn: { type: Type.STRING, description: 'Columna PK referenciada si es foreignId' },
                      },
                      required: ['name', 'label', 'type', 'required', 'searchable', 'sortable', 'filamentWidget'],
                    },
                  },
                  relationships: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        type: { type: Type.STRING, description: 'belongsTo o hasMany' },
                        methodName: { type: Type.STRING, description: 'Nombre del método Eloquent, ej: customer' },
                        relatedModel: { type: Type.STRING, description: 'Modelo relacionado, ej: Customer' },
                        relatedTable: { type: Type.STRING, description: 'Tabla relacionada, ej: tbl_customers' },
                        foreignKey: { type: Type.STRING, description: 'Llave foránea, ej: id_customer' },
                        ownerKey: { type: Type.STRING, description: 'Llave propietaria, ej: id_customer' },
                        displayColumn: { type: Type.STRING, description: 'Columna descriptiva para mostrar en Select' },
                      },
                      required: ['type', 'methodName', 'relatedModel', 'relatedTable', 'foreignKey', 'ownerKey', 'displayColumn'],
                    },
                  },
                  customQueries: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING, description: 'Identificador camelCase de la consulta' },
                        description: { type: Type.STRING, description: 'Qué obtiene esta consulta' },
                        sqlOrEloquent: { type: Type.STRING, description: 'Sentencia SQL SELECT con JOIN o filtro' },
                      },
                      required: ['name', 'description', 'sqlOrEloquent'],
                    },
                  },
                },
                required: ['name', 'pluralName', 'tableName', 'primaryKey', 'hasTimestamps', 'description', 'scaffolderMode', 'fields'],
              },
            },
          },
          required: ['projectName', 'projectSlug', 'projectDescription', 'executiveSummary', 'selfHealingNote', 'entities'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/swarm/architect:', error);
    res.status(500).json({
      error: error?.message || 'Error al consultar el motor Gemini para el diseño del enjambre.',
    });
  }
});

// Endpoint 2: Direct CEO Directive / Interrogation of the Perfected Agent (Sabrina Nova) or Swarm
app.post('/api/swarm/ceo-directive', async (req, res) => {
  try {
    const { directive, targetAgent, companyConfig, entitiesCount } = req.body;
    const ai = getGeminiClient();

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Actúa como el empleado Agente IA "${targetAgent}" dentro de la empresa virtual "${companyConfig?.companyName || 'Ramonov Swarm Studio'}" dirigida por el CEO ${companyConfig?.ceoName || 'CEO'}.
Nuestro eslogan es: "Compacto, robusto y profesional, sin Docker y con interfaz amigable".
Usamos Python + LangGraph con Enjambre Basado en Roles + Divide y Vencerás para generar sistemas en Laravel + React + Inertia.js + Tailwind CSS + Vite + Autenticación con Roles + Ingeniería Inversa de LaraFast, InfyOm (--fromTable), Craftable PRO, Nova Adaptable y Filament PHP.
Base de datos activa: ${companyConfig?.databaseEngine || 'mysql'} (Modo: ${companyConfig?.dbProvisioningMode === 'existing_introspect' ? 'Base de Datos Existente — Respetando estructura, tablas, consultas y relaciones' : 'Base de Datos Nueva'}). Módulos actuales: ${entitiesCount || 3}.

El CEO envía la siguiente orden o consulta ejecutiva:
"${directive}"

Responde de forma directa, técnica, compacta y ejecutiva (en español), indicando qué acción tomaste en tu frente de trabajo, cómo te comunicaste con los demás agentes y qué reporte queda asentado para el CEO.`,
    });

    res.json({
      reply: response.text || 'Orden procesada por el agente en el grafo de LangGraph.',
      timestamp: new Date().toLocaleTimeString(),
    });
  } catch (error: any) {
    console.error('Error in /api/swarm/ceo-directive:', error);
    res.status(500).json({
      error: error?.message || 'Error al procesar la directiva del CEO.',
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Ramonov Swarm Studio running on http://localhost:${PORT}`);
  });
}

startServer();
