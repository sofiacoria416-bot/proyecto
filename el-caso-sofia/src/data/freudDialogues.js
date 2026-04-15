/**
 * freudDialogues.js — Todos los textos de Freud organizados por momento
 * Fuente: FREUD_textos_completos.md
 */

// ============================================================
// F-01 — BIENVENIDA AL CONSULTORIO
// ============================================================
export const F01_BIENVENIDA = [
  'Ah. Llegaste.',
  'Sabía que ibas a venir. Los casos importantes siempre terminan llegando solos.',
  'Me llamo Sigmund Freud. Aunque imagino que eso ya lo sabías.\nPasá. No te quedes parada en la puerta.',
  'Hay algo en este consultorio que me tiene intrigado hace un tiempo.\nUn caso sin resolver. Complejo, con muchas aristas, bastante material reprimido.',
  'El nombre del caso: Sofía.',
  'Antes de mostrarte lo que encontré, necesito hacerte algunas preguntas.\nNo para evaluarte. Para que vos misma recuerdes.\n¿Empezamos?',
]

// ============================================================
// PREGUNTA 1: ¿Cómo describirías a la persona que te trajo hasta acá?
// ============================================================
export const Q1 = {
  questionKey: 'q1_como_describes',
  lines: ['¿Cómo describirías a la persona que te trajo hasta acá?'],
  options: [
    { key: 'risa', label: 'Alguien con quien me reí mucho' },
    { key: 'siempre', label: 'Alguien que conozco desde siempre' },
    { key: 'complicado', label: 'Alguien complicado de explicar' },
    { key: 'inesperado', label: 'Alguien que no esperaba' },
  ],
  responses: {
    risa: [
      'El humor como síntoma de vínculo profundo.\nNo es un diagnóstico menor — es uno de los más favorables que existen.',
      'La risa compartida implica un código compartido.\nY un código compartido implica que dos personas construyeron algo juntas, aunque no lo hayan llamado así.',
      'Anotado. Seguimos.',
    ],
    siempre: [
      '"Desde siempre" es una hipérbole, claro.\nPero las hipérboles no son errores. Son la forma en que el inconsciente mide el tiempo.',
      'Cuando uno dice "desde siempre", lo que dice es: esta persona existió antes de que yo tuviera palabras para describirla.\nEso es bastante.',
      'Seguimos.',
    ],
    complicado: [
      'Los casos más interesantes siempre lo son.',
      'Si fuera fácil de explicar, no estaría acá.\nNa k ve con la complejidad — es exactamente lo que hace que algo valga la pena analizar.',
      'Seguimos.',
    ],
    inesperado: [
      'Lo inesperado tiene una característica particular en el psiquismo:\nuno no sabe que lo estaba esperando hasta que llega.',
      'No es contradicción. Es estructura.\nEl deseo no avisa.',
      'Anotado. Seguimos.',
    ],
  },
}

// ============================================================
// PREGUNTA 2: ¿Hubo un momento en que creíste que esta historia había terminado?
// ============================================================
export const Q2 = {
  questionKey: 'q2_creyste_que_termino',
  lines: ['¿Hubo un momento en que creíste que esta historia había terminado?'],
  options: [
    { key: 'si_lo_acepto', label: 'Sí, y lo acepté' },
    { key: 'si_no_del_todo', label: 'Sí, pero nunca lo creí del todo' },
    { key: 'no_sabia', label: 'No, sabía que iba a volver' },
    { key: 'no_respondo', label: 'Prefiero no responder eso' },
  ],
  responses: {
    si_lo_acepto: [
      'La aceptación es un trabajo. No un estado pasivo.\nQue lo hayas hecho dice algo sobre vos.',
      'Aunque — y esto es entre nosotros —\naceptar que algo terminó no siempre significa que terminó.\nA veces es solo que el duelo necesitaba tener un nombre.',
      'Seguimos.',
    ],
    si_no_del_todo: [
      'Eso es lo más honesto que me dijiste hasta ahora.',
      'La creencia total en el fin de algo requiere que el objeto haya sido completamente tramitado.\nCuando eso no pasa, queda un resto.\nUn resto no es una debilidad. Es evidencia de que había algo real.',
      'Seguimos.',
    ],
    no_sabia: [
      'Eso es o muy neurótico obsesivo... o muy cierto.',
      'En cualquier caso, el resultado es el mismo.\nAcá estás.',
      'Seguimos.',
    ],
    no_respondo: [
      'La resistencia también es información.\nDe hecho, a veces es la información más importante.',
      'No te voy a insistir. No es mi estilo.\nPero lo anoté igual.',
      'Seguimos.',
    ],
  },
}

// ============================================================
// PREGUNTA 3: ¿Qué es lo primero que recordás?
// ============================================================
export const Q3 = {
  questionKey: 'q3_que_recuerdas_primero',
  lines: ['¿Qué es lo primero que recordás?'],
  options: [
    { key: 'una_risa', label: 'Una risa' },
    { key: 'una_cancion', label: 'Una canción' },
    { key: 'un_beso', label: 'Un beso' },
    { key: 'un_momento', label: 'Un momento que preferiría no olvidar nunca' },
  ],
  responses: {
    una_risa: [
      'La risa como memoria primaria. Interesante.',
      'No es el recuerdo más frecuente. La mayoría de la gente recuerda una imagen, un lugar.\nQue vos recuerdes un sonido — y específicamente ese sonido — dice que el vínculo se inscribió en el cuerpo antes que en la cabeza.',
      'Eso es de los que duran.',
      'Seguimos.',
    ],
    una_cancion: [
      'La música.\nEl único lenguaje que el aparato psíquico no puede traducir del todo — solo sentir.',
      'Una canción como primer recuerdo significa que hubo algo que las palabras no alcanzaban.\nY que alguien encontró la forma de decirlo igual.',
      'Seguimos.',
    ],
    un_beso: [
      'Bueno.',
      'Podría decir muchas cosas sobre esto desde la teoría.\nPero voy a abstenerme, porque en este caso la teoría sobra.',
      'Lo anoto y seguimos.',
    ],
    un_momento: [
      'Esa frase tiene una construcción particular.\nNo dijiste "un momento que no voy a olvidar".\nDijiste "que preferiría no olvidar".',
      'La preferencia implica que sabés que el olvido es posible.\nY que elegís, activamente, que no pase.\nEso no es memoria. Es decisión.',
      'Seguimos.',
    ],
  },
}

// ============================================================
// F-02 — TRANSICIÓN AL TABLERO
// ============================================================
export const F02_TRANSICION = [
  'Bien. Tengo suficiente para mostrarte algo.',
  'Al fondo del consultorio hay una sala que uso para los casos que no puedo resolver solo.\nEste es uno de esos.',
  'Lo que vas a ver ahí adentro es evidencia. Fragmentos. Piezas de algo que todavía no tiene forma completa.\nYo lo estuve mirando mucho tiempo.\nPero creo que vos podés conectar lo que yo no pude.',
  'Seguime.',
]

// ============================================================
// F-03 — PRESENTACIÓN DEL TABLERO
// ============================================================
export const F03_TABLERO = [
  'Esto es lo que tenemos.',
  'Cada zona es un período. Cada fragmento, una evidencia.\nNada está completo todavía — pero todo está acá.',
  'Tu trabajo es explorarlo. Conectarlo.\nYo voy a estar cerca por si necesitás algo.',
  'Empezá por donde quieras.',
]

// ============================================================
// LÍNEAS SUELTAS — Para cuando Sofía está en el tablero
// Fuente: FREUD_textos_completos.md, PARTE III
// ============================================================
export const LINEAS_ESPERA = [
  ['Tómese el tiempo que necesite. El inconsciente no tiene horario.'],
  ['Estoy aquí. No tengo apuro. Es usted la del cumpleaños, no yo.'],
  ['Todo lo que está en ese tablero tiene sentido.\nSolo hay que mirarlo desde el ángulo correcto.'],
  ['Si algo le llama la atención, hágale caso.\nLa intuición es el inconsciente trabajando horas extra.'],
  ['A veces las piezas se conectan solas.\nSolo hay que dejar de forzarlas.'],
  ['El tiempo en análisis funciona distinto al tiempo del reloj.\nAcá adentro, todo lo que importó, todavía importa.'],
]

// Array ordenado de las 3 preguntas para iterar
export const QUESTIONS = [Q1, Q2, Q3]

// ============================================================
// F-08 — BIENVENIDA DEL DÍA DEL CUMPLEAÑOS
// Fuente: FREUD_textos_completos.md — sección F-08
// ============================================================
export const F08_BIENVENIDA = [
  'Hoy es distinto.',
  'No solo porque es tu cumpleaños — aunque eso también cuenta, y no soy de los que ignoran las fechas.',
  'Sino porque hoy cerramos el caso.\nEl diagnóstico final. Lo que queda después de juntar todo.',
  'Hay tres archivos nuevos en el tablero.\nEl último es el más importante.\nEl penúltimo tiene humor, que para el trabajo que viene después, no viene mal.',
  'Feliz cumpleaños, Sofía.\nDicho esto — al tablero.',
]

// ============================================================
// F-09 — INTRODUCCIÓN ARCHIVO 004: LO QUE NUNCA FUE Y AHORA ES
// Fuente: FREUD_textos_completos.md — sección F-09
// ============================================================
export const F09_ARCHIVO004 = [
  'Este archivo lo preparó alguien que no soy yo.',
  'Yo me limité a guardarlo acá hasta que llegara el momento indicado.\nEl momento, según entiendo, es hoy.',
  'El sobre tiene un sello de cera.\nCuando estés lista, lo abrís.\nNo hay apuro.',
]

// ============================================================
// F-07 — CIERRE DE LA FASE 1
// Fuente: FREUD_textos_completos.md — sección F-07
// ============================================================
export const F07_CIERRE_FASE1 = [
  'Anamnesis completa.',
  'Esto que lograste construir hoy es lo que en análisis llamamos la historia del sujeto.\nNo la historia que se cuenta en los almuerzos familiares.\nLa otra. La que tiene huecos y costuras y cosas que no cierran del todo y que justamente por eso son verdaderas.',
  'Pero esto no es el final del caso.\nEs apenas el diagnóstico diferencial.',
  'Mañana — el día de tu cumpleaños — este consultorio va a tener algo nuevo para vos.\nNo te lo anticipo.\nYa sabés dónde encontrarme.',
]

// ============================================================
// F-05 — INTRODUCCIÓN ZONA 2: EL PARÉNTESIS
// ============================================================
export const F05_ZONA2 = [
  'Esta parte del caso es la más delicada.\nLos archivos estuvieron clasificados mucho tiempo.',
  'No porque fueran peligrosos.\nSino porque eran difíciles de sostener.',
  'En el análisis, hay un concepto que se llama Nachträglichkeit.\nLo que en alemán sería... el efecto retroactivo del tiempo sobre el sentido.\nUna cosa que en su momento no se podía entender, y que después —\ncon lo que vino después — sí.',
  'Lo que vas a ver acá no es agradable en todos sus puntos.\nPero los casos no se resuelven ignorando las partes difíciles.\n¿Seguimos?',
]

// ============================================================
// R-B — RESPUESTAS REACTIVAS ZONA 2 (por etiqueta elegida)
// ============================================================
export const RB_RESPONSES = {
  pausa: [
    'Pausa.\nTécnicamente correcto.\nUna pausa no es un final — es una cesura. La música también las tiene.',
    'Aunque yo preferiría que exploráramos por qué elegiste la metáfora más amable.\nNa k ve, claro. Es su análisis, no el mío.',
  ],
  espera: [
    'Espera.\nEso implica que había algo que esperar.\nQue en el medio del paréntesis había, en algún lugar, una expectativa.',
    'La espera sin objeto es angustia.\nLa espera con objeto es otra cosa.\nUsted sabe bien cuál de las dos fue.',
  ],
  ruido: [
    'Ruido.\nEl ruido es lo que tapa la señal.\nLo interesante no es el ruido — es lo que estaba debajo que el ruido no dejaba escuchar.',
    'Que hoy pueda nombrarlo así ya es trabajo hecho.',
  ],
  distancia: [
    'Distancia.\nGeográfica o psíquica, me pregunto.',
    'En cualquier caso, la distancia tiene una propiedad curiosa:\nhace visible lo que la cercanía opaca.\nA veces se necesita el espacio para ver el objeto con claridad.',
    'No lo recomiendo como método. Pero funciona.',
  ],
  latencia: [
    'Latencia. Usted estudia psicología, se nota.',
    'En términos estrictos: período en que algo existe pero no se manifiesta.\nNo ausencia. Suspensión.',
    'Es la palabra más técnicamente precisa de las opciones disponibles.\nY probablemente también la más verdadera.\nBien elegida.',
  ],
  necesario: [
    'El sujeto tiene capacidad de simbolización. Buen signo.',
    'Llamar "necesario" a algo que duele es un movimiento de alta complejidad psíquica.\nNo es negación — es integración.\nSon cosas distintas, aunque desde afuera se parezcan.',
    'Me quedo con que sabe la diferencia.',
  ],
  injusto: [
    'La justicia no es una categoría analítica.\nPero el enojo sí lo es.',
    'Que lo nombre así dice que hay algo que todavía tiene temperatura.\nEso no es un problema. Es honestidad.',
    'Los afectos fríos son los que preocupan. Este no lo es.',
  ],
}

// ============================================================
// F-06 — INTRODUCCIÓN ZONA 3: EL REENCUENTRO
// ============================================================
export const F06_ZONA3 = [
  'Ah. Acá mejora.',
  'Esta zona documenta lo que pasó después del paréntesis.\nEl retorno, que en psicoanálisis siempre es más interesante que la partida.',
  'Lo que vas a ver es una línea de tiempo.\nCada punto en esa línea está cerrado. Los vas a abrir vos, en orden.\nAlgunos tienen fotos. Algunos tienen texto. Uno solo tiene una frase.',
  'El último punto no tiene fecha todavía.\nEso también dice algo.',
]

// ============================================================
// F-04 — INTRODUCCIÓN ZONA 1: EL ORIGEN
// ============================================================
export const F04_ZONA1 = [
  'Todo caso tiene un origen.\nNo el origen que uno cree que tuvo — el real. El que después, con distancia, uno puede ver.',
  'En esta zona vas a encontrar el principio de la historia.\nHay una foto que todavía no se puede ver. Hay que desbloquearla.\nPara eso, tres preguntas. No de cultura general. De memoria.',
  'Si estuviste ahí, las sabés.',
]

// ============================================================
// LÍNEAS SUELTAS PARA QUIZ Y CASETE
// ============================================================
export const FREUD_QUIZ_FAIL = [
  'No exactamente.',
  'Intente de nuevo — el recuerdo a veces necesita más de un intento para aparecer.\nNa k ve con el fracaso. El fracaso es parte del método.',
]

export const FREUD_CASETE_LOCKED = [
  'Primero identificá al sujeto.',
]

export const FREUD_HIDDEN_OBJECT_FOUND = [
  'Veo que es observadora.\nEso no me sorprende.',
]

// ============================================================
// F-10 — INTRODUCCIÓN ARCHIVO 005: SÍNTOMAS SELECCIONADOS
// ============================================================
export const F10_ARCHIVO005 = [
  'Todo buen análisis necesita un momento de distensión.\nIncluso yo me reía, a veces. Poco. Pero a veces.',
  'Lo que ves acá son cinco fichas clínicas.\nCada una describe algo. Una situación, un rasgo, un momento.\nTu trabajo es clasificarlas con la categoría que mejor te parezca.',
  'Las opciones son: síntoma, defensa, acting out, sublimación, transferencia positiva.\nNo hay respuestas incorrectas.\nHay respuestas más interesantes que otras, pero eso es diferente.',
  'Cuando termines, las fichas se van a ordenar solas.\nLo que quede armado va a ser el diagnóstico de la pareja.\nHecho por vos.',
]

// ============================================================
// F-11 — INTRODUCCIÓN ARCHIVO 006: EL CASO CERRADO
// ============================================================
export const F11_ARCHIVO006 = [
  'Última parada.',
  'Acá no hay mecánica. No hay que conectar nada ni clasificar nada.\nSolo hay que mirar.',
  'Los mejores casos no se resuelven. Se comprenden.\nEste es uno de esos.',
]

// ============================================================
// F-12 — DIAGNÓSTICO FINAL
// ============================================================
export const F12_DIAGNOSTICO_FINAL = [
  'Caso cerrado.',
  'Diagnóstico final:\nUna historia que sobrevivió a sí misma.',
  'Etiología: desconocida, como la mayoría de las cosas que importan.\nCurso: intermitente, con período de latencia prolongado y retorno espontáneo.\nPronóstico: muy bueno.',
  'Ha sido un placer trabajar este caso con vos, Sofía.\nDe los que uno no olvida.',
  'Feliz cumpleaños.',
]
