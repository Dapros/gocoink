# GoCoink — Guía para agentes de IA

## 1. Antes de escribir código

- Este proyecto usa **Expo SDK 58**. Las APIs cambian entre versiones: consulta la documentación de esa versión en https://docs.expo.dev/versions/v58.0.0/ y no te fíes de ejemplos de SDKs anteriores.
- Gestor de paquetes: **Bun** (`bun.lock`).
  - `bun install` instala las dependencias.
  - `bun start` (o `bun run android` / `bun run ios` o para expo go `bunx expo start` ) arranca la app.
  - `bun run lint` ejecuta `expo lint`. Es la única comprobación automática.
- No hay tests. Verifica los cambios con `bun run lint` y en la app.

## 2. Qué es GoCoink

App móvil (Android / iOS) para registrar gastos e ingresos. Es **100 % offline-first**: no tiene backend y todos los datos viven en archivos SQLite locales.

Flujo de negocio:

- **Zero-state / Onboarding**: si no existe ningún perfil (archivo `.db`), `OnboardingSetup` pide elegir la modalidad inicial.
- **Modalidades de corte** (`cycle_mode`):
  - `monthly`: ciclos de ~1 mes con fecha fija. Se puede posponer el corte si el pago se retrasa.
  - `biweekly`: cortes cada 15 días. También se puede posponer. *Pendiente (no implementado):* evaluar el balance general en el segundo corte quincenal.
  - `free`: modo libre para independientes, sin salario ni fechas fijas (salario = 0, no se evalúan cortes).
- **Evaluación de corte**: cuando el ciclo vence, `CycleEvaluator` permite posponerlo o cerrarlo y abrir uno nuevo. `CycleNavigator` permite recorrer los ciclos anteriores.
- **Multi-perfil**: cada perfil es un archivo `.db` independiente que se puede crear, renombrar, borrar o cambiar.
- **Exportar / Importar**: archivos `.xls` en formato XML Spreadsheet 2003, compatible con Excel.
- **Analítica**: `DonutChart` muestra el porcentaje gastado del presupuesto del ciclo.
- **Métodos de pago**: los datos iniciales (Efectivo, Bancolombia, Nequi) son **solo de demostración**: indican por dónde entra o sale el dinero. No existe ningún convenio con bancos. A largo plazo (no ahora) el usuario podrá elegir sus bancos de una lista; no implementes eso sin que se pida.

## 3. Stack

| Área | Tecnología |
|---|---|
| Framework | Expo SDK 58 · React Native 0.88 (New Architecture obligatoria) · React 19.3 |
| Navegación | Expo Router (rutas por archivos) + `TopTabs` de `expo-router/js-top-tabs`, abajo y deslizables |
| Lenguaje | TypeScript 6 en modo estricto |
| Estado | Zustand 5 (+ AsyncStorage) |
| Base de datos | `expo-sqlite` |
| Archivos | `expo-file-system/legacy`, `expo-sharing`, `expo-document-picker` |
| UI | Estilos inline nativos, `react-native-svg`, `expo-image`, Ionicons (`@expo/vector-icons`) |
| Animaciones | `Animated` y `PanResponder` de React Native |
| Validación | `zod` 4 |

## 4. Mapa del proyecto

```
app/
├── _layout.tsx            # Stack raíz
├── +not-found.tsx         # Pantalla 404
└── (tabs)/
    ├── _layout.tsx        # Tabs (top tabs abajo) + GlobalSheet, OnboardingSetup y CycleEvaluator
    ├── index.tsx          # Inicio: DonutChart, filtros, lista de transacciones
    └── plan.tsx           # Plan, perfiles, importar y exportar
components/
├── ui/                    # Componentes base: USAR SIEMPRE antes de crear otros
│   ├── Button.tsx         # variantes: primary | danger | outline | fab | icon
│   ├── Input.tsx          # TextInput con estilo y mensaje de error
│   ├── Select.tsx         # Selector en modal
│   ├── DatePicker.tsx     # Envoltorio del DateTimePicker nativo
│   ├── BottomSheet.tsx    # Modal inferior animado (PanResponder)
│   ├── TransactionCard.tsx
│   └── TransactionForm.tsx
├── CycleEvaluator.tsx     # Modal de corte (posponer / cerrar ciclo)
├── CycleNavigator.tsx     # Navegación entre ciclos anteriores
├── DonutChart.tsx         # Gráfico SVG del presupuesto
├── FilterBar.tsx          # Filtros: tipo, tiempo, método
├── GlobalSheet.tsx        # BottomSheet global (crear / ver / editar transacción)
└── OnboardingSetup.tsx    # Asistente del primer perfil
constants/theme.ts         # COLORS y SIZES
services/database.ts       # DatabaseService: única capa de acceso a SQLite
store/                     # useSettingsStore, useSheetStore, useFilterStore
types/index.ts             # Tipos de dominio, tipos Raw* y schemas zod
utils/
├── cycleHelpers.ts        # formatCycleTitle
├── dateHelpers.ts         # processTransactions (agrupar y ordenar)
└── excelHelpers.ts        # ExcelService (exportar e importar XML 2003)
```

## 5. Modelo de datos y estado

- **`services/database.ts` (`DatabaseService`)** es el único sitio que habla con SQLite.
  - Llama a `await DatabaseService.initialize()` antes de cualquier consulta. Este método abre la conexión, activa `PRAGMA foreign_keys = ON`, crea las tablas y carga los datos iniciales.
  - Tablas: `categories`, `payment_methods`, `transactions`, `user_settings`, `cycles`.
  - Gestión de archivos `.db`: `setDatabaseName`, `listAvailableDatabases`, `renameCurrentDatabase`, `deleteDatabaseFile`. El perfil por defecto es `gocoink_v1.db`.
  - Si necesitas una consulta nueva, añádela aquí como método tipado con los tipos de `@/types`. No abras SQLite desde componentes o stores.
- **Stores de Zustand**:
  - `useSettingsStore`: perfil activo, ciclo, salario y cambio de base de datos. Guarda el perfil activo en AsyncStorage con la clave `gocoink_active_db`. Para cambiar de perfil usa sus acciones; no cambies la DB a mano.
  - `useSheetStore`: controla `GlobalSheet` (modos `create | details | edit`) y la transacción seleccionada.
  - `useFilterStore`: filtros de tipo, tiempo y método, guardados con `persist` + AsyncStorage.
- **`types/index.ts`**: los tipos de dominio usan camelCase. Los tipos `Raw*` usan snake_case porque reflejan exactamente las columnas de SQLite que se exportan. Las columnas se guardan en snake_case en SQL y `DatabaseService` las convierte a camelCase en TS.
- **Ciclos**:
  - `user_settings` tiene una sola fila (`id = 1`) con el **ciclo activo**: `cycle_mode`, `base_salary` y `cycle_start_date`.
  - `cycles` guarda el **historial** de ciclos.
  - **Posponer** suma 1 día a `cycle_start_date` (`CycleEvaluator` → `handleSnooze`).
  - **Cerrar el ciclo** llama a `saveSettings(...)` con el salario nuevo y la fecha de hoy, y así abre un ciclo nuevo.
- **Transacciones**: `amount` siempre es positivo (zod `positive`). Si es ingreso o gasto lo indica `type` (`'income' | 'expense'`); nunca guardes montos negativos.

### Fechas (regla obligatoria)

Toda fecha nueva se guarda en la **hora local del dispositivo**. Una transacción registrada a las 11:50 p. m. del día X debe quedar en el día X, nunca en el siguiente.

- **No** uses `new Date().toISOString()` para fechas nuevas. Devuelve la hora en UTC y, en Colombia (UTC-5), todo lo que se registre después de las 7 p. m. queda guardado con fecha del día siguiente.
- Guarda las fechas con `toLocalISOString()` de `@/utils/dateHelpers` (ISO con el offset local, por ejemplo `2026-10-21T23:50:00-05:00`). Para una fecha concreta, pásala como argumento: `toLocalISOString(fecha)`.
- Las fechas antiguas guardadas en UTC siguen siendo válidas porque `new Date()` las interpreta bien. No las reescribas sin que se pida.
- Para mostrar o agrupar fechas, conviértelas siempre con `new Date(...)` y los métodos locales (`getDate`, `toLocaleDateString('es-CO')`). No cortes el texto de la fecha (`split('T')`).

### Cambios de esquema (migraciones)

Los `.db` de los usuarios ya existen. `CREATE TABLE IF NOT EXISTS` **no** modifica tablas que ya existen, así que una columna nueva nunca les llegaría.

- Todo cambio de esquema se añade como un string SQL **al final** del array `MIGRATIONS` en `services/database.ts`. `runMigrations` (que se llama desde `initialize()`) aplica en orden los pasos pendientes, cada uno en su transacción, y sube `PRAGMA user_version`.
- Nunca edites, borres ni reordenes un paso que ya exista: ya se ejecutó en los `.db` de los usuarios.
- Si añades una columna nueva, añádela también al `CREATE TABLE`, para que las bases nuevas nazcan completas. Escribe la migración de forma que no falle sobre una base recién creada (por ejemplo, un `ALTER TABLE ... ADD COLUMN` de una columna que ya está en el `CREATE` sí fallaría). Si dudas, no la pongas en el `CREATE` y deja que la migración la añada.
- No edites un `CREATE TABLE` existente esperando que se aplique a bases ya creadas.
- Si cambias columnas, actualiza también los tipos `Raw*` y `ExcelService` (exportar e importar).

## 6. Reglas de código

- **Componentes UI**: usa `components/ui/*` para acciones y formularios:
  - `Button` para acciones.
  - `Input` para texto y números.
  - `Select` para listas de opciones.
  - `DatePicker` para fechas.
  - `BottomSheet` para modales.

  Usa `TouchableOpacity` directamente solo en cards, ítems de lista o toggles con un layout propio.
- **Colores y medidas**: tómalos siempre de `COLORS` y `SIZES` (`@/constants/theme`) y no escribas valores hex sueltos. Tokens:
  - `background` `#121212`
  - `surface` `#1E1E1E`
  - `surfaceLight` `#27272A`
  - `primary` `#10B981` (verde, ingresos)
  - `danger` `#EF4444` (rojo, gastos)
  - `text` `#FFFFFF`
  - `textMuted` `#A1A1AA`
  - `border` `#3F3F46`
- **Estilos**: usa estilos inline o `StyleSheet` nativos. El proyecto no usa NativeWind ni Tailwind.
- **Imágenes**: usa `Image` de `expo-image` con `contentFit`, no la de `react-native`.
- **Animaciones**: usa `Animated` y `PanResponder` de React Native. No uses Reanimated sin acordarlo antes (está instalado pero no se usa).
- **Imports**: usa siempre el alias `@/` (por ejemplo, `import { COLORS } from '@/constants/theme'`).
- **Moneda**: dale formato con `.toLocaleString('es-CO')`.
- **Validación**: valida los formularios con zod. Los schemas que se compartan van en `@/types`.
- **Tipado**: mantén el modo estricto y no uses `any`, salvo al parsear XML en bruto.
- **Comentarios**: escríbelos en español, como en el resto del código.

## 7. Flujo de trabajo con git

- Los agentes trabajan **solo** en la rama `agents`, sin crear subramas. Nunca hacen commits ni push directamente a `main`.
- **Pregunta siempre antes de hacer merge a `main`.**
- Commits con formato Conventional Commits y la descripción en español:
  - `feat: agrega filtro por categoría en FilterBar`
  - `fix: corrige fecha guardada en UTC al crear transacción`
  - `refactor: modifica cálculo de fin de ciclo`
  - `chore: elimina tipo CycleMode obsoleto`
  - `docs: actualiza AGENTS.md`

## 8. Checklist antes de terminar

- [ ] `bun run lint` pasa sin errores.
- [ ] Se usan los componentes de `components/ui/*` y los colores de `COLORS`.
- [ ] Las fechas nuevas se guardan en hora local (ver "Fechas").
- [ ] Si cambió el esquema: hay migración con `user_version`, y los tipos `Raw*` y la exportación/importación están actualizados.
- [ ] Si se tocó la gestión de perfiles o la DB: probado sin perfiles (onboarding) y con varios perfiles.

## 9. Trampas conocidas

- **Nunca ejecutes `bun run reset-project`**: borra la estructura del proyecto.
- `CycleMode` en `types/index.ts` declara `'disabled'`, pero la DB y la UI usan `'free'` (`services/database.ts`, `app/(tabs)/plan.tsx`, `components/OnboardingSetup.tsx`). El valor real es `'free'`.
- Las fechas guardadas antes de `toLocalISOString` están en UTC (`...Z`) y las nuevas llevan offset (`-05:00`). `ORDER BY` en SQL ordena el texto, así que entre registros antiguos y nuevos de la misma noche el orden puede desfasarse unas horas. Para ordenar con exactitud, hazlo en JS con `new Date(...)`.
- El filtro por método de pago (`processTransactions`) asume que `paymentMethodId === 1` es Efectivo y que cualquier otro id es un banco. Depende del orden de los datos iniciales.
- Los valores `rgba(...)` y `#000` que aparecen en el código solo se aceptan para fondos semitransparentes de modales y sombras. Cualquier otro color sale de `COLORS`.
- `expo-file-system` se importa desde `expo-file-system/legacy`. La API nueva tiene otra forma.
- El README menciona Tailwind/NativeWind, pero el proyecto no los usa.
