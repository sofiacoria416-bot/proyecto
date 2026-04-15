/**
 * content.js — Datos de contenido para "El Caso Sofía"
 * Fuente: LINEA_DE_TIEMPO_hitos.md
 */

// ============================================================
// NOTA INTRODUCTORIA ZONA 3 (del creador, aparece antes de la línea)
// ============================================================
export const NOTA_Z3 = `Reconstruir esto en detalle me dolió más de lo que esperaba.
Hay cosas que uno entierra sin darse cuenta, y acordarse de ellas con fecha y todo tiene un peso particular cuanto menos.

Pero lo hice igual. Porque cuando miro todo junto,
el principio, el medio, lo que pasó en el medio del medio,
lo que veo al final es lo que somos hoy.
Eso valió cada parte del camino, bella.

Mirá.`

// ============================================================
// LÍNEA DE TIEMPO — 22 hitos
// ============================================================
export const TIMELINE = [
  {
    key: 'hit_01_nacimiento_sofia',
    fecha: '16 de abril de 2008',
    titulo: 'El día que nació Sofía',
    texto: 'Acá empieza todo, aunque ninguno de los dos lo sabía todavía. Vos cumplías años. Yo todavía no existía del todo en tu historia. Pero ya existías en el mundo, y eso no es un detalle menor.',
    tieneFoto: true,
    fotoFile: 'foto_hit_01.jpg',
  },
  {
    key: 'hit_02_nacimiento_thiago',
    fecha: '22 de abril de 2008',
    titulo: 'Seis días después, nació el otro personaje de este caso',
    texto: 'Ahora nací yo xD.',
    tieneFoto: true,
    fotoFile: 'foto_hit_02.jpg',
  },
  {
    key: 'hit_03_conocerse',
    fecha: 'Octubre de 2021',
    titulo: 'Un cumpleaños. Una persona que pide el número. Un chico que no la remaba ni ahí.',
    texto: 'Nos conocimos en un cumpleaños. Solo existe esta foto xD. Vos me pediste el número. Yo no la remaba. Para nada. Esto es un dato importante sobre mí que probablemente ya conocés.',
    tieneFoto: true,
    fotoFile: 'foto_hit_03.jpg',
  },
  {
    key: 'hit_04_audios_manana',
    fecha: 'Noviembre de 2021 — todos los días',
    titulo: 'Los audios de las mañanas',
    texto: 'Durante todo noviembre me grabaste un audio todas las mañanas contando tu vida. Todos. Los. Días. No sé si eras consciente de lo que eso significaba para mí. Yo tampoco era muy consciente todavía, honestamente. Pero me esperaba esos audios.',
    tieneFoto: false,
    fotoFile: null,
  },
  {
    key: 'hit_05_noquis_primera_vez',
    fecha: '29 de noviembre de 2021',
    titulo: 'Ñoquis, tu casa, la primera vez',
    texto: 'Fui a tu casa por primera vez con Sebastián. Comimos ñoquis. Vi dónde vivías, cómo era el espacio que habitabas (ahre que decia el loco no).',
    tieneFoto: true,
    fotoFile: 'foto_hit_05.jpg',
  },
  {
    key: 'hit_06_primer_beso',
    fecha: '3 de diciembre de 2021',
    titulo: 'El parque cívico. La vuelta caminando. La puerta de tu casa.',
    texto: 'Salimos de la escuela y fuimos al parque cívico. Después volvimos caminando y te acompañé hasta tu puerta. En la puerta te pregunté: ¿Nos besamos? Y nos besamos. Ese fue el primer beso de mi vida. No se me va a olvidar nunca.',
    tieneFoto: false,
    fotoFile: null,
  },
  {
    key: 'hit_07_fin_primera_etapa',
    fecha: '14 de diciembre de 2021',
    titulo: 'Fin de la primera etapa',
    texto: 'Éramos muy chiquitos. Nos dimos cuenta de que las cosas no pintaban bien y lo dejamos ahí. Guardé eso en mi diario.',
    tieneFoto: true,
    fotoFile: 'foto_hit_07.jpg',
  },
  {
    key: 'hit_08_cumple_no_fui',
    fecha: '15 de abril de 2022',
    titulo: 'El cumpleaños al que no fui',
    texto: 'Le pedí a Maxi y a Lauti que te dijeran que me invitaran a tu cumple. La respuesta fue que no. Me quedé sin ir. Ese fue el primero de los cumpleaños tuyos a los que no estuve. Lo recuerdo porque quería ir.',
    tieneFoto: false,
    fotoFile: null,
  },
  {
    key: 'hit_09_pediste_ayuda',
    fecha: '14 de abril de 2023',
    titulo: 'Me escribiste pidiendo ayuda',
    texto: 'Me escribiste porque estabas muy mal por algo con tu pareja. Te respondí. Te contuve. Después te distanciaste igual. No te lo reprocho. Lo entiendo ahora mucho mejor que entonces. Pero me quedé pensando en vos ese día.',
    tieneFoto: false,
    fotoFile: null,
  },
  {
    key: 'hit_10_quince_anos',
    fecha: '15 de abril de 2023',
    titulo: 'Tu cumpleaños de 15. Emilio y Los Reboltosos en escena.',
    texto: 'Mi banda tocó en tu cumpleaños de 15. Estuve ahí. En el mismo espacio que vos. Tocando. Y sin embargo no estaba en tu cumple. Estaba en el show.',
    tieneFoto: true,
    fotoFile: 'foto_hit_10.jpg',
  },
  {
    key: 'hit_11_amigos_de_nuevo',
    fecha: 'Mediados de 2023',
    titulo: 'Amigos de nuevo. Siempre el mismo rol.',
    texto: 'Volvimos a hablar. Como amigos. Ese año te gustaron como veinte personas distintas y yo estaba siempre ahí bancándote y riéndome con vos. También me amenazaron varias veces. Era parte del lore. Bue.',
    tieneFoto: true,
    fotoFile: 'foto_hit_11.jpg',
  },
  {
    key: 'hit_12_fats_battle',
    fecha: '2024',
    titulo: 'Fats Battle. El proyecto. Las juntadas.',
    texto: 'Trabajamos juntos en Fats Battle. Nos juntamos mucho. Era raro y era bueno al mismo tiempo. Como muchas cosas en esta historia.',
    tieneFoto: true,
    fotoFile: 'foto_hit_12.jpg',
  },
  {
    key: 'hit_13_reencuentro_real',
    fecha: '29 de mayo de 2025',
    titulo: 'El reencuentro real',
    texto: 'Volvimos a hablar. Los dos estábamos rotos, cada uno a su manera. Vos recién salías de algo que te había atado más de tres años. Yo estaba pasando momentos difíciles internamente.',
    tieneFoto: true,
    fotoFile: 'foto_hit_13.jpg',
  },
  {
    key: 'hit_14_mates',
    fecha: '16 de junio de 2025',
    titulo: 'Mates',
    texto: 'Tomamos mates. Ese mismo día le admití a Nico que había sido un placer. Y en algún momento de esa semana, mientras tocaba la guitarra, te miré. Y me di cuenta de que sos la mujer más hermosa que vi en mi vida. No lo pensé, simplemente me llegó la data del cielo.',
    tieneFoto: true,
    fotoFile: 'foto_hit_14.jpg',
  },
  {
    key: 'hit_15_prefiero_morirme',
    fecha: '18 de junio de 2025',
    titulo: '"Prefiero morirme con él"',
    texto: 'Me agendaste como "prefiero morirme con él". La cosa avanzaba rápido, parece.',
    tieneFoto: true,
    fotoFile: 'foto_hit_15.jpg',
  },
  {
    key: 'hit_16_primera_merienda',
    fecha: '2 de julio de 2025',
    titulo: 'La primera merienda',
    texto: 'Salimos a merendar solos por primera vez. Eso fue una cita aunque ninguno de los dos lo dijo en voz alta todavía.',
    tieneFoto: true,
    fotoFile: 'foto_hit_16.jpg',
  },
  {
    key: 'hit_17_ribelatto_kifak',
    fecha: '4 de septiembre de 2025',
    titulo: 'Ribelatto toca en Kifak. Las miradas.',
    texto: 'Toqué con la banda en Kifak. Me hacía el desentendido. Tus miradas me volvían loco igual.',
    tieneFoto: true,
    fotoFile: 'foto_hit_17.jpg',
  },
  {
    key: 'hit_18_planetario',
    fecha: '22 de octubre de 2025',
    titulo: 'El planetario',
    texto: 'Salimos con el grupo escolar al planetario. Estabas hermosa. Eso es todo lo que tengo para decir sobre ese día.',
    tieneFoto: true,
    fotoFile: 'foto_hit_18.jpg',
  },
  {
    key: 'hit_19_capacitacion',
    fecha: '18 de noviembre de 2025',
    titulo: 'La capacitación en Ingeniería Social',
    texto: 'Te vi dominar un escenario de una manera que no esperaba. Me sorprendió. Verte así siendo exactamente quien sos, es una experiencia que no voy a olvidar.',
    tieneFoto: true,
    fotoFile: 'foto_hit_19.jpg',
  },
  {
    key: 'hit_20_juntadas_2026',
    fecha: 'Enero — Febrero — Marzo — Abril de 2026',
    titulo: 'Más juntadas.',
    texto: 'Nos juntamos mucho esos meses. Y cada día que pasaba me daba más cuenta de lo lindo que es tenerte cerca. Más de lo que ya sabía.',
    tieneFoto: true,
    fotoFile: 'foto_hit_20.jpg',
  },
  {
    key: 'hit_final_primer_cumple',
    fecha: '16 de abril de 2026',
    titulo: 'El primer cumpleaños',
    texto: 'Este es el primero. El primero de tus cumpleaños en el que estoy. QUE LOCO. Feliz cumpleaños, Sofff<33.',
    tieneFoto: false,
    fotoFile: null,
  },
  {
    key: 'hit_en_curso',
    fecha: null,
    titulo: null,
    texto: 'Esta historia la seguimos escribiendo día a día.',
    tieneFoto: false,
    fotoFile: null,
    isEnCurso: true,
  },
]

// ============================================================
// FICHAS CLÍNICAS — Archivo 005
// ============================================================
export const FICHAS = [
  {
    key: 'ficha_01',
    titulo: 'Caso de forclusión verbal excesiva',
    contenido: 'Los sujetos no pueden parar de expresar su risa cuando alguno de los dos menciona el termino "forcluido" o "forclusión" dentro de su oración. El equipo de analistas de la Escuela Freudiana de Buenos Aires no encuentra clasificación exacta de este fenómeno.',
  },
  {
    key: 'ficha_02',
    titulo: 'Caso de desvío del campo escópico por exceso de superyó',
    contenido: 'Durante las sesiones se ha observado como Sofia, cada vez que Thiago le realiza un cumplido, sostiene su mirada y luego la desvía hacía la izquierda, procendiendole una risa risueña, indicando posiblemente que el superyó, la ley, tomó el control de sus ojos y cuello. El equipo de analistas de la Escuela Freudiana de Buenos Aires no encuentra clasificación exacta de este fenómeno que afecta el campo de visión de Sofía, aparentemente, en contra de su voluntad.',
  },
  {
    key: 'ficha_03',
    titulo: 'Caso de oralidad extrema',
    contenido: 'Disclaimer: El equipo de analistas de la Escuela Freudiana de Buenos Aires no encontró mejor nombre a este caso sin resolver que el observado, aprobado previamente por el DR. Freud.\n\nDurante las sesiones se ha observado como, tanto Thiago como Sofía, manifiestan una inclinación brutal a todo lo relacionado con la oralidad. Sofía menciona tener ganas de comer todo el tiempo y Thiago, por su parte, lleva constantemente objetos a su boca. Parecería que comparten la misma fijación oral, aunque su causa y clasificación siguen siendo un misterio.\n\nNotas del psicoanalista encargado: espero que la chica que Freud dijo que traería a resolver estos casos no nos quite el trabajo. Aunque la casualidad es muy grande: tiene el mismo nombre de la chica de estos archivos.',
  },
  {
    key: 'ficha_04',
    titulo: 'Caso de retentividad anal',
    contenido: 'Al parecer, una forma de controlar el caos externo para no sentir el descontrol interno, es limpiar, ordenar e intentar controlar todo. Incluso llegando a intentar controlar sus pulsiones internas, desafiando las leyes psicoanalíticas. Ambos pacientes, Thiago y Sofía, manifiestan esta tendencia, aunque de diferentes maneras.\n\nCompartir esta característica puede ser un goce (sí, lo dije) o un desastre total.',
  },
  {
    key: 'ficha_05',
    titulo: 'Caso de neurosis compartida y funcional de alto rendimiento',
    contenido: 'Durante las sesiones se observaron complejos de Edipo por parte de ambos pacientes que, lejos de generar conflicto, se complementaron sin necesidad de invocar a la madre. Parecería que el deseo no está anudado a la falta. Se quieren tanto y tan bien que la causalidad extrema de este caso llama la atención de los analistas, quienes no encuentran clasificación exacta de este fenómeno compartido. Creo que es todo corrupción de Freud.',
  },
]

export const ETIQUETAS = [
  { key: 'sintoma', label: 'síntoma' },
  { key: 'defensa', label: 'defensa' },
  { key: 'acting_out', label: 'acting out' },
  { key: 'sublimacion', label: 'sublimación' },
  { key: 'transferencia_positiva', label: 'transferencia positiva' },
]

// ============================================================
// RESPUESTAS REACTIVAS R-C
// ============================================================
const RC = {
  sintoma: {
    humor: ['Síntoma. Clásico.\nRecuerde que el síntoma es la forma que encuentra el inconsciente de decir algo que no puede decirse de otra manera.\nEn este caso, parece que lo dice bastante bien.'],
    rasgo: ['El síntoma no es el problema — es la solución que el sujeto encontró al problema.\nVisto así, es bastante creativo.'],
    pareja: ['Síntoma de pareja. Los hay peores.\nMucho peores.'],
  },
  defensa: {
    humor: ['La defensa más sofisticada que existe es el humor.\nFreud dixit — y en este caso, Freud soy yo.'],
    rasgo: ['Defensa. Puede ser.\nPero hay defensas que además de proteger, construyen algo.\nEsta parece ser de esas.'],
    pareja: ['Toda defensa tiene una lógica.\nLa pregunta no es si defiende — es de qué.\nEsa respuesta, por ahora, la dejo para usted.'],
  },
  acting_out: {
    humor: ['Acting out.\nLa acción como sustituto de la palabra.\nMuy de la época. Muy humano también.'],
    rasgo: ['Esto tiene un exceso de ello, claramente.\nEl superyó estaba de vacaciones ese día.'],
    pareja: ['El acting out dice: no tengo palabras para esto, entonces lo hago.\nA veces lo que se hace habla mejor que lo que se dice.\nA veces.'],
  },
  sublimacion: {
    humor: ['Sublimación. La más elegante de las operaciones psíquicas.\nFreud la consideraba el pico del desarrollo humano.\nY Freud soy yo, así que tome eso con la seriedad que merece.'],
    rasgo: ['Tomar algo y convertirlo en otra cosa más valiosa.\nEso es exactamente lo que hace la sublimación.\nY también, en cierta forma, lo que hace el amor. Na k ve, claro.'],
    pareja: ['Sublimación. Optimista de su parte.\nPero no le falta razón.'],
  },
  transferencia_positiva: {
    humor: ['La transferencia positiva es la base de todo vínculo terapéutico.\nY según parece, también de otros tipos de vínculo.\nNo me sorprende.'],
    rasgo: ['Transferencia positiva.\nAfecto desplazado desde otro objeto hacia el presente.\nEn términos simples: cariño con historia adentro.'],
    pareja: ['Técnicamente, la transferencia es una repetición.\nPero hay repeticiones que mejoran el original.\nEso también existe.'],
  },
}

const FICHA_TIPO = {
  ficha_01: 'humor',
  ficha_02: 'rasgo',
  ficha_03: 'humor',
  ficha_04: 'rasgo',
  ficha_05: 'pareja',
}

export function getReaccionFreud(fichaKey, etiquetaKey) {
  const tipo = FICHA_TIPO[fichaKey] || 'rasgo'
  return RC[etiquetaKey]?.[tipo] ?? RC[etiquetaKey]?.rasgo ?? ['Interesante elección.']
}

// ============================================================
// T-07 — DIAGNÓSTICO OFICIAL (visible en el tablero final)
// ============================================================
export const T07_DIAGNOSTICO = `El diagnóstico es claro: su amor, primeramente propio y luego con el otro, es puramente sincero y real.`

// ============================================================
// T-08 — MENSAJE DE LA CAJA ESCONDIDA
// ============================================================
export const T08_CAJA = `Hoy vas a recibir un regalo. Cuando hayas terminado la experiencia llamáme y preparáte para que te pueda ver 4 minutos. Ese tiempo basta.`
