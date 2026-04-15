# PROMPT — Creación de Base de Datos Supabase
### "El Caso Sofía" — Migración completa desde cero
#### Versión final con todos los detalles del proyecto incorporados

---

Eres un experto en diseño de bases de datos con acceso completo a Supabase.
Tu tarea es crear la estructura completa de base de datos para una experiencia
web interactiva llamada "El Caso Sofía". A continuación te describo el
sistema completo con todos sus detalles. Creá todas las tablas, columnas,
tipos de datos, restricciones, relaciones, índices y políticas de Row Level
Security necesarias. No omitas nada. Ejecutá todo como una sola migración
SQL ordenada al final.

---

## DESCRIPCIÓN DEL SISTEMA

Es una experiencia web con una sola usuaria: Sofía. Accede mediante un link
único con un token en la URL, sin login ni contraseña. El sistema la reconoce
por ese token y guarda todo su progreso de manera persistente entre sesiones.

La experiencia tiene dos fases temporales:
- FASE 1 (Anamnesis): se desbloquea el 15 de abril de 2026
- FASE 2 (Diagnóstico): se desbloquea el 16 de abril de 2026 (cumpleaños)

El sistema compara la fecha actual con esas fechas para determinar qué mostrar.

---

## TABLA 1: sessions

Propósito: registrar la sesión única de Sofía y controlar el estado global.

Columnas:
- id: UUID, primary key, generado automáticamente con gen_random_uuid()
- token: TEXT, único, no nulo
- created_at: TIMESTAMP WITH TIME ZONE, default now()
- last_seen_at: TIMESTAMP WITH TIME ZONE, nullable — se actualiza en
  cada visita
- phase_1_unlock_date: DATE, no nulo
- phase_2_unlock_date: DATE, no nulo
- phase_1_completed: BOOLEAN, default false
- phase_2_completed: BOOLEAN, default false
- experience_fully_completed: BOOLEAN, default false

---

## TABLA 2: dialogue_choices

Propósito: guardar las tres elecciones de Sofía en el diálogo inicial con
Freud. Afectan textos en toda la experiencia.

Columnas:
- id: UUID, primary key, gen_random_uuid()
- session_id: UUID, foreign key → sessions.id, ON DELETE CASCADE, no nulo
- question_key: TEXT, no nulo
  Valores posibles exactos:
  'q1_como_describes'
  'q2_creyste_que_termino'
  'q3_que_recuerdas_primero'
- chosen_option: TEXT, no nulo — texto completo de la opción elegida
- chosen_option_key: TEXT, no nulo — clave corta para lógica condicional
  Para q1: 'risa' | 'siempre' | 'complicado' | 'inesperado'
  Para q2: 'si_lo_acepto' | 'si_no_del_todo' | 'no_sabia' | 'no_respondo'
  Para q3: 'una_risa' | 'una_cancion' | 'un_beso' | 'un_momento'
- answered_at: TIMESTAMP WITH TIME ZONE, default now()

Restricción UNIQUE: (session_id, question_key)

---

## TABLA 3: zone_progress

Propósito: estado de cada zona del tablero de la Fase 1. Hay exactamente
tres zonas.

Columnas:
- id: UUID, primary key, gen_random_uuid()
- session_id: UUID, foreign key → sessions.id, ON DELETE CASCADE, no nulo
- zone_key: TEXT, no nulo
  Valores posibles exactos:
  'zona_1_origen'
  'zona_2_parentesis'
  'zona_3_reencuentro'
- is_unlocked: BOOLEAN, default false
- is_completed: BOOLEAN, default false
- quiz_completed: BOOLEAN, default false
  (aplica a zona_1_origen — el quiz que desbloquea la foto)
- hilo_connected: BOOLEAN, default false
  (aplica a zona_1_origen — el casete conectado a la foto con un hilo)
- hidden_object_found: BOOLEAN, default false
  (aplica a zona_1_origen — el sobre escondido en el rincón)
- label_chosen: TEXT, nullable
  (aplica a zona_2_parentesis — la palabra que Sofía elige para describir
  el paréntesis. Valores posibles: 'pausa' | 'espera' | 'ruido' |
  'distancia' | 'latencia' | 'necesario' | 'injusto')
- timeline_hits_opened: INTEGER, default 0
  (aplica a zona_3_reencuentro — contador de hitos abiertos)
- timeline_total_hits: INTEGER, default 22
  (aplica a zona_3_reencuentro — total de hitos de la línea de tiempo.
  La línea de tiempo tiene exactamente 22 entradas: 20 hitos numerados,
  1 hito final con fecha del cumpleaños, y 1 hito "en curso")
- unlocked_at: TIMESTAMP WITH TIME ZONE, nullable
- completed_at: TIMESTAMP WITH TIME ZONE, nullable

Restricción UNIQUE: (session_id, zone_key)

---

## TABLA 4: timeline_hits

Propósito: registrar qué hitos específicos de la línea de tiempo abrió Sofía.

Columnas:
- id: UUID, primary key, gen_random_uuid()
- session_id: UUID, foreign key → sessions.id, ON DELETE CASCADE, no nulo
- hit_key: TEXT, no nulo
  Valores posibles exactos (22 en total):
  'hit_01_nacimiento_sofia'
  'hit_02_nacimiento_thiago'
  'hit_03_primer_encuentro'
  'hit_04_audios_noviembre'
  'hit_05_noquis'
  'hit_06_primer_beso'
  'hit_07_fin_primera_etapa'
  'hit_08_cumple_sin_ir'
  'hit_09_pidio_ayuda'
  'hit_10_cumple_15_banda'
  'hit_11_amigos_2023'
  'hit_12_fats_battle'
  'hit_13_reencuentro_real'
  'hit_14_mates'
  'hit_15_me_agendo'
  'hit_16_primera_merienda'
  'hit_17_show_kifak'
  'hit_18_planetario'
  'hit_19_capacitacion'
  'hit_20_enero_febrero'
  'hit_final_primer_cumple'
  'hit_en_curso'
- opened_at: TIMESTAMP WITH TIME ZONE, default now()

Restricción UNIQUE: (session_id, hit_key)

---

## TABLA 5: archive_progress

Propósito: estado de cada archivo de la Fase 2 (Diagnóstico). Hay
exactamente tres archivos.

Columnas:
- id: UUID, primary key, gen_random_uuid()
- session_id: UUID, foreign key → sessions.id, ON DELETE CASCADE, no nulo
- archive_key: TEXT, no nulo
  Valores posibles exactos:
  'archivo_004_nunca_fue'
  'archivo_005_sintomas'
  'archivo_006_caso_cerrado'
- is_unlocked: BOOLEAN, default false
- is_completed: BOOLEAN, default false
- sobre_opened: BOOLEAN, default false
  (aplica a archivo_004 — el sobre con sello de cera)
- fichas_all_labeled: BOOLEAN, default false
  (aplica a archivo_005 — las cinco fichas clínicas etiquetadas)
- hidden_box_found: BOOLEAN, default false
  (aplica a archivo_006 — la caja escondida con el mensaje de los bombones)
- unlocked_at: TIMESTAMP WITH TIME ZONE, nullable
- completed_at: TIMESTAMP WITH TIME ZONE, nullable

Restricción UNIQUE: (session_id, archive_key)

---

## TABLA 6: ficha_labels

Propósito: la etiqueta que Sofía eligió para cada una de las cinco fichas
clínicas del Archivo 005.

Columnas:
- id: UUID, primary key, gen_random_uuid()
- session_id: UUID, foreign key → sessions.id, ON DELETE CASCADE, no nulo
- ficha_key: TEXT, no nulo
  Valores posibles exactos:
  'ficha_01' | 'ficha_02' | 'ficha_03' | 'ficha_04' | 'ficha_05'
- label_chosen: TEXT, no nulo
  Valores posibles exactos:
  'sintoma' | 'defensa' | 'acting_out' | 'sublimacion' |
  'transferencia_positiva'
- labeled_at: TIMESTAMP WITH TIME ZONE, default now()

Restricción UNIQUE: (session_id, ficha_key)

---

## TABLA 7: rewards_unlocked

Propósito: recompensas desbloqueadas por Sofía, con registro de si las
reprodujo y/o descargó.

Columnas:
- id: UUID, primary key, gen_random_uuid()
- session_id: UUID, foreign key → sessions.id, ON DELETE CASCADE, no nulo
- reward_key: TEXT, no nulo
  Valores posibles exactos:
  'audio_michelle_guitarra'      → se desbloquea al completar Zona 1
  'carta_informe_clinico'        → se desbloquea al completar Zona 2
  'video_anecdota_reencuentro'   → se desbloquea al completar Zona 3
  'boleto_merienda'              → se desbloquea al completar Archivo 004
  'foto_archivo_005'             → se desbloquea al completar Archivo 005
  'audio_risk_it_all_guitarra'   → se desbloquea al completar Archivo 006
- unlocked_at: TIMESTAMP WITH TIME ZONE, default now()
- reproduced_at: TIMESTAMP WITH TIME ZONE, nullable
  (se registra la primera vez que Sofía reproduce el contenido en la página)
- downloaded_at: TIMESTAMP WITH TIME ZONE, nullable
  (se registra cuando Sofía hace clic en descargar)

Restricción UNIQUE: (session_id, reward_key)

---

## TABLA 8: hidden_objects

Propósito: objetos escondidos que Sofía puede o no encontrar explorando.
No son obligatorios para completar la experiencia.

Columnas:
- id: UUID, primary key, gen_random_uuid()
- session_id: UUID, foreign key → sessions.id, ON DELETE CASCADE, no nulo
- object_key: TEXT, no nulo
  Valores posibles exactos (5 objetos en total):
  'sobre_rincon_zona1'
  (sobre pequeño en el rincón de la Zona 1, solo visible al hacer hover)
  'libro_estante_consultorio'
  (libro clickeable en el estante del consultorio)
  'caja_archivo006'
  (caja escondida en el Archivo 006 con el mensaje de los bombones físicos)
  'palabra_subrayada_zona2'
  (palabra clickeable en el documento del Paréntesis)
  'reloj_consultorio'
  (el reloj del fondo del consultorio, clickeable)
- found_at: TIMESTAMP WITH TIME ZONE, default now()

Restricción UNIQUE: (session_id, object_key)

---

## TABLA 9: quiz_answers

Propósito: respuestas de Sofía al quiz de la Zona 1, que desbloquea la foto.
Permite múltiples intentos por pregunta.

Columnas:
- id: UUID, primary key, gen_random_uuid()
- session_id: UUID, foreign key → sessions.id, ON DELETE CASCADE, no nulo
- question_index: INTEGER, no nulo — número de pregunta (1, 2 o 3)
- answer_given: TEXT, no nulo
- is_correct: BOOLEAN, no nulo
- attempt_number: INTEGER, no nulo, default 1
- answered_at: TIMESTAMP WITH TIME ZONE, default now()

Sin restricción UNIQUE — se permiten múltiples intentos por pregunta.

---

## TABLA 10: session_events

Propósito: log cronológico de todas las acciones de Sofía. Permite al
administrador ver en detalle cómo vivió la experiencia.

Columnas:
- id: UUID, primary key, gen_random_uuid()
- session_id: UUID, foreign key → sessions.id, ON DELETE CASCADE, no nulo
- event_type: TEXT, no nulo
  Valores posibles:
  'session_start'
  'waiting_screen_viewed'
  'phase1_accessed'
  'phase2_accessed'
  'freud_dialogue_started'
  'dialogue_question_answered'
  'zone_started'
  'zone_completed'
  'quiz_attempted'
  'quiz_passed'
  'hilo_connected'
  'label_chosen'
  'timeline_hit_opened'
  'hidden_object_found'
  'archive_started'
  'archive_completed'
  'reward_unlocked'
  'reward_reproduced'
  'reward_downloaded'
  'experience_completed'
- event_detail: JSONB, nullable
  Ejemplos de uso:
  Para 'zone_completed': {"zone_key": "zona_1_origen", "time_spent_seconds": 342}
  Para 'dialogue_question_answered': {"question_key": "q1_como_describes", "chosen_option_key": "risa"}
  Para 'timeline_hit_opened': {"hit_key": "hit_06_primer_beso", "hit_number": 6}
  Para 'reward_downloaded': {"reward_key": "audio_michelle_guitarra"}
- occurred_at: TIMESTAMP WITH TIME ZONE, default now()

---

## CONFIGURACIONES ADICIONALES

### 1. Row Level Security

Activar RLS en todas las tablas. Crear las siguientes políticas:

Para la tabla `sessions`:
- Política SELECT: permite leer si el header 'x-session-token' coincide
  con el campo token de la fila.

Para todas las demás tablas (dialogue_choices, zone_progress, timeline_hits,
archive_progress, ficha_labels, rewards_unlocked, hidden_objects,
quiz_answers, session_events):
- Política SELECT, INSERT y UPDATE: permite operar sobre filas cuyo
  session_id corresponda a una sesión cuyo token coincida con el header
  'x-session-token'.

La verificación del token se hace mediante la función auxiliar
`get_session_id_from_token()` descrita abajo.

### 2. Función: get_session_id_from_token()

```sql
CREATE OR REPLACE FUNCTION get_session_id_from_token()
RETURNS UUID AS $$
  SELECT id FROM sessions
  WHERE token = current_setting('request.headers', true)::json->>'x-session-token'
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

Esta función es usada internamente por las políticas RLS.

### 3. Función: get_or_create_session(p_token TEXT)

Comportamiento:
- Busca si existe una sesión con ese token exacto.
- Si existe: actualiza last_seen_at a now() y retorna la fila completa.
- Si NO existe: no crea nada. Las sesiones solo las crea el administrador
  manualmente desde el dashboard de Supabase. Retorna NULL.

Retorna: la fila completa de sessions o NULL.

### 4. Función: get_complete_progress(p_session_id UUID)

Retorna en un solo query todo el estado de Sofía, estructurado como JSONB:
- El registro completo de sessions (sin el token)
- Todas las filas de zone_progress para esa session_id
- Todas las filas de archive_progress para esa session_id
- Todas las filas de dialogue_choices para esa session_id
- Todas las filas de rewards_unlocked para esa session_id
- Todas las filas de hidden_objects para esa session_id
- Todas las filas de ficha_labels para esa session_id
- El conteo de timeline_hits abiertos para esa session_id
- El conteo de quiz_answers correctas para esa session_id

Esto permite cargar el estado completo de la app en una sola llamada
al iniciar la sesión, sin múltiples roundtrips.

### 5. Vista: session_dashboard

Para uso exclusivo del administrador desde el dashboard de Supabase.
Sin RLS restrictivo.

Debe mostrar por fila (una sola fila en producción):
- token
- phase_1_unlock_date
- phase_2_unlock_date
- last_seen_at
- phase_1_completed
- phase_2_completed
- experience_fully_completed
- zona_1_completada (boolean)
- zona_2_completada (boolean)
- zona_3_completada (boolean)
- archivo_004_completado (boolean)
- archivo_005_completado (boolean)
- archivo_006_completado (boolean)
- recompensas_desbloqueadas (integer — count)
- recompensas_descargadas (integer — count de downloaded_at no nulo)
- objetos_escondidos_encontrados (integer — count de los 5 posibles)
- hitos_timeline_abiertos (integer — count de los 22 posibles)
- dialogos_respondidos (integer — count de los 3 posibles)
- fichas_etiquetadas (integer — count de las 5 posibles)

### 6. Índices a crear

- sessions: índice en token (ya cubierto por UNIQUE, confirmar)
- dialogue_choices: índice en session_id
- zone_progress: índice en session_id
- timeline_hits: índice en session_id
- archive_progress: índice en session_id
- ficha_labels: índice en session_id
- rewards_unlocked: índice en session_id
- hidden_objects: índice en session_id
- quiz_answers: índice en session_id
- session_events: índice en session_id, índice en occurred_at

---

## INSERT INICIAL — La sesión de Sofía

Insertar exactamente una fila en sessions con los siguientes valores:

- token: 'el-caso-sofia-2026'
- phase_1_unlock_date: '2026-04-15'
  (un día antes del cumpleaños — Fase 1 se desbloquea el 15 de abril de 2026)
- phase_2_unlock_date: '2026-04-16'
  (día del cumpleaños de Sofía — Fase 2 se desbloquea el 16 de abril de 2026)
- phase_1_completed: false
- phase_2_completed: false
- experience_fully_completed: false
- created_at: now()
- last_seen_at: NULL

Insertar también las tres filas iniciales en zone_progress para esta sesión,
con is_unlocked en true solo para zona_1_origen (la primera zona ya está
desbloqueada cuando Sofía entra a la Fase 1), y false para las otras dos:

- zona_1_origen: is_unlocked = true, todo lo demás en default
- zona_2_parentesis: is_unlocked = false, todo lo demás en default
- zona_3_reencuentro: is_unlocked = false, timeline_total_hits = 22,
  todo lo demás en default

Insertar también las tres filas iniciales en archive_progress para esta sesión,
con is_unlocked en false para todos (se desbloquean progresivamente el día
del cumpleaños):

- archivo_004_nunca_fue: is_unlocked = false
- archivo_005_sintomas: is_unlocked = false
- archivo_006_caso_cerrado: is_unlocked = false

---

## ORDEN DE EJECUCIÓN DE LA MIGRACIÓN

Ejecutar todo en este orden exacto como una sola migración:

1. Crear extensión uuid-ossp si no existe
2. Crear tabla sessions
3. Crear tabla dialogue_choices
4. Crear tabla zone_progress
5. Crear tabla timeline_hits
6. Crear tabla archive_progress
7. Crear tabla ficha_labels
8. Crear tabla rewards_unlocked
9. Crear tabla hidden_objects
10. Crear tabla quiz_answers
11. Crear tabla session_events
12. Crear todos los índices
13. Crear función get_session_id_from_token()
14. Crear función get_or_create_session()
15. Crear función get_complete_progress()
16. Activar RLS en todas las tablas
17. Crear todas las políticas RLS
18. Crear vista session_dashboard
19. INSERT de la sesión de Sofía en sessions
20. INSERT de las tres filas en zone_progress
21. INSERT de las tres filas en archive_progress