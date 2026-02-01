export const INSTRUCTORS = [
    'IZQUIERDO',
    'DRIS',
    'RODRIGUEZ',
    'PRIETO',
    'BENJUMEA',
    'SORIANO',
    'DUEÑAS'
];

export const STUDENTS = [
    'EXPOSITO',
    'MELLADO',
    'PACHON',
    'ESPINOSA',
    'TRUJILLO',
    'CARRILLO',
    'COMPTE',
    'M.PEREZ',
    'GUERRERO',
    'S.ALONSO',
    'GAYO',
    'CUADRADO',
    'DE LAS MORAS'
];

// Custom Sort Order requested by User
export const ORDERED_STUDENT_NAMES = [
    'CUADRADO',
    'DE LAS MORAS',
    'M.PEREZ',
    'GUERRERO',
    'TRUJILLO',
    'ESPINOSA',
    'CARRILLO',
    'COMPTE',
    'S.ALONSO',
    'GAYO',
    'MELLADO',
    'EXPOSITO',
    'PACHON'
];

export const AIRCRAFT_REGISTRATIONS = [
    ...Array.from({ length: 14 }, (_, i) => `ET-${180 + i}`)
];

export const SESSION_TYPES = [
    'VBAS',
    'VRAD',
    'VPRA'
];

export const ZONES = [
    'Zona 1',
    'Zona 2',
    'Zona 3',
    'Zona 4',
    'Zona 5'
];

// Keep generic SESSIONS for backward compatibility if needed, but we'll use SESSION_TYPES + input in UI
export const SESSIONS = [
    ...Array.from({ length: 12 }, (_, i) => `VBAS-${i + 1}`),
    ...Array.from({ length: 20 }, (_, i) => `VPRA-${i + 1}`)
];

export const FLIGHT_TYPES = [
    'Real',
    'Entrenador',
    'Simulador'
];

export const SESSION_NUMBERS = [
    ...Array.from({ length: 20 }, (_, i) => String(i + 1)),
    ...Array.from({ length: 10 }, (_, i) => `INCID-${i + 1}`)
];

export const AIRPORT_CODES = [
    'GCAD', 'GCAR', 'GCAT', 'GCDC', 'GCFV', 'GCGM', 'GCGO', 'GCHG', 'GCHI', 'GCHU',
    'GCLA', 'GCLB', 'GCLG', 'GCLP', 'GCPM', 'GCPU', 'GCRR', 'GCTS', 'GCXM', 'GCXO',
    'GECE', 'GEHM', 'GEML', 'GSAI', 'GSVO', 'LEAA', 'LEAB', 'LEAE', 'LEAF', 'LEAG',
    'LEAH', 'LEAI', 'LEAJ', 'LEAK', 'LEAL', 'LEAM', 'LEAO', 'LEAP', 'LEAS', 'LEAT',
    'LEAV', 'LEAX', 'LEAZ', 'LEBA', 'LEBB', 'LEBC', 'LEBD', 'LEBE', 'LEBF', 'LEBG',
    'LEBH', 'LEBI', 'LEBJ', 'LEBK', 'LEBL', 'LEBM', 'LEBN', 'LEBO', 'LEBP', 'LEBQ',
    'LEBR', 'LEBS', 'LEBT', 'LEBU', 'LEBV', 'LEBW', 'LEBX', 'LEBZ', 'LECA', 'LECB',
    'LECC', 'LECD', 'LECE', 'LECF', 'LECG', 'LECH', 'LECI', 'LECJ', 'LECK', 'LECL',
    'LECM', 'LECN', 'LECO', 'LECP', 'LECQ', 'LECR', 'LECS', 'LECT', 'LECU', 'LECV',
    'LECW', 'LECX', 'LECY', 'LECZ', 'LEDA', 'LEDB', 'LEDC', 'LEDD', 'LEDE', 'LEDF',
    'LEDG', 'LEDH', 'LEDI', 'LEDJ', 'LEDK', 'LEDL', 'LEDM', 'LEDN', 'LEDO', 'LEDP',
    'LEDQ', 'LEDR', 'LEDS', 'LEDT', 'LEDU', 'LEDV', 'LEDW', 'LEDX', 'LEDY', 'LEDZ',
    'LEEA', 'LEEB', 'LEEC', 'LEED', 'LEEE', 'LEEF', 'LEEG', 'LEEH', 'LEEI', 'LEEJ',
    'LEEK', 'LEEL', 'LEEM', 'LEEN', 'LEEO', 'LEEP', 'LEEQ', 'LEER', 'LEES', 'LEET',
    'LEEU', 'LEEV', 'LEEW', 'LEEX', 'LEEY', 'LEEZ', 'LEFA', 'LEFB', 'LEFC', 'LEFD',
    'LEFE', 'LEFF', 'LEFG', 'LEFH', 'LEFI', 'LEFJ', 'LEFK', 'LEFL', 'LEFM', 'LEFN',
    'LEFO', 'LEFP', 'LEFQ', 'LEFR', 'LEFS', 'LEFT', 'LEFU', 'LEFV', 'LEFW', 'LEFX',
    'LEFY', 'LEFZ', 'LEGA', 'LEGB', 'LEGC', 'LEGD', 'LEGE', 'LEGF', 'LEGG', 'LEGH',
    'LEGI', 'LEGJ', 'LEGK', 'LEGL', 'LEGM', 'LEGN', 'LEGO', 'LEGP', 'LEGQ', 'LEGR',
    'LEGS', 'LEGT', 'LEGU', 'LEGV', 'LEGW', 'LEGX', 'LEGY', 'LEGZ', 'LEHA', 'LEHB',
    'LEHC', 'LEHD', 'LEHE', 'LEHF', 'LEHG', 'LEHH', 'LEHI', 'LEHJ', 'LEHK', 'LEHL',
    'LEHM', 'LEHN', 'LEHO', 'LEHP', 'LEHQ', 'LEHR', 'LEHS', 'LEHT', 'LEHU', 'LEHV',
    'LEHW', 'LEHX', 'LEHY', 'LEHZ', 'LEIA', 'LEIB', 'LEIC', 'LEID', 'LEIE', 'LEIF',
    'LEIG', 'LEIH', 'LEII', 'LEIJ', 'LEIK', 'LEIL', 'LEIM', 'LEIN', 'LEIO', 'LEIP',
    'LEIQ', 'LEIR', 'LEIS', 'LEIT', 'LEIU', 'LEIV', 'LEIW', 'LEIX', 'LEIY', 'LEIZ',
    'LEJA', 'LEJB', 'LEJC', 'LEJD', 'LEJE', 'LEJF', 'LEJG', 'LEJH', 'LEJI', 'LEJJ',
    'LEJK', 'LEJL', 'LEJM', 'LEJN', 'LEJO', 'LEJP', 'LEJQ', 'LEJR', 'LEJS', 'LEJT',
    'LEJU', 'LEJV', 'LEJW', 'LEJX', 'LEJY', 'LEJZ', 'LEKA', 'LEKB', 'LEKC', 'LEKD',
    'LEKE', 'LEKF', 'LEKG', 'LEKH', 'LEKI', 'LEKJ', 'LEKK', 'LEKL', 'LEKM', 'LEKN',
    'LEKO', 'LEKP', 'LEKQ', 'LEKR', 'LEKS', 'LEKT', 'LEKU', 'LEKV', 'LEKW', 'LEKX',
    'LEKY', 'LEKZ', 'LELA', 'LELB', 'LELC', 'LELD', 'LELE', 'LELF', 'LELG', 'LELH',
    'LELI', 'LELJ', 'LELK', 'LELL', 'LELM', 'LELN', 'LELO', 'LELP', 'LELQ', 'LELR',
    'LELS', 'LELT', 'LELU', 'LELV', 'LELW', 'LELX', 'LELY', 'LELZ', 'LEMA', 'LEMB',
    'LEMC', 'LEMD', 'LEME', 'LEMF', 'LEMG', 'LEMH', 'LEMI', 'LEMJ', 'LEMK', 'LEML',
    'LEMM', 'LEMN', 'LEMO', 'LEMP', 'LEMQ', 'LEMR', 'LEMS', 'LEMT', 'LEMU', 'LEMV',
    'LEMW', 'LEMX', 'LEMY', 'LEMZ', 'LENA', 'LENB', 'LENC', 'LEND', 'LENE', 'LENF',
    'LENG', 'LENH', 'LENI', 'LENJ', 'LENK', 'LENL', 'LENM', 'LENN', 'LENO', 'LENP',
    'LENQ', 'LENR', 'LENS', 'LENT', 'LENU', 'LENV', 'LENW', 'LENX', 'LENY', 'LENZ',
    'LEOA', 'LEOB', 'LEOC', 'LEOD', 'LEOE', 'LEOF', 'LEOG', 'LEOH', 'LEOI', 'LEOJ',
    'LEOK', 'LEOL', 'LEOM', 'LEON', 'LEOO', 'LEOP', 'LEOQ', 'LEOR', 'LEOS', 'LEOT',
    'LEOU', 'LEOV', 'LEOW', 'LEOX', 'LEOY', 'LEOZ', 'LEPA', 'LEPB', 'LEPC', 'LEPD',
    'LEPE', 'LEPF', 'LEPG', 'LEPH', 'LEPI', 'LEPJ', 'LEPK', 'LEPL', 'LEPM', 'LEPN',
    'LEPO', 'LEPP', 'LEPQ', 'LEPR', 'LEPS', 'LEPT', 'LEPU', 'LEPV', 'LEPW', 'LEPX',
    'LEPY', 'LEPZ', 'LEQA', 'LEQB', 'LEQC', 'LEQD', 'LEQE', 'LEQF', 'LEQG', 'LEQH',
    'LEQI', 'LEQJ', 'LEQK', 'LEQL', 'LEQM', 'LEQN', 'LEQO', 'LEQP', 'LEQQ', 'LEQR',
    'LEQS', 'LEQT', 'LEQU', 'LEQV', 'LEQW', 'LEQX', 'LEQY', 'LEQZ', 'LERA', 'LERB',
    'LERC', 'LERD', 'LERE', 'LERF', 'LERG', 'LERH', 'LERI', 'LERJ', 'LERK', 'LERL',
    'LERM', 'LERN', 'LERO', 'LERP', 'LERQ', 'LERR', 'LERS', 'LERT', 'LERU', 'LERV',
    'LERW', 'LERX', 'LERY', 'LERZ', 'LESA', 'LESB', 'LESC', 'LESD', 'LESE', 'LESF',
    'LESG', 'LESH', 'LESI', 'LESJ', 'LESK', 'LESL', 'LESM', 'LESN', 'LESO', 'LESP',
    'LESQ', 'LESR', 'LESS', 'LEST', 'LESU', 'LESV', 'LESW', 'LESX', 'LESY', 'LESZ',
    'LETA', 'LETB', 'LETC', 'LETD', 'LETE', 'LETF', 'LETG', 'LETH', 'LETI', 'LETJ',
    'LETK', 'LETL', 'LETM', 'LETN', 'LETO', 'LETP', 'LETQ', 'LETR', 'LETS', 'LETT',
    'LETU', 'LETV', 'LETW', 'LETX', 'LETY', 'LETZ', 'LEUA', 'LEUB', 'LEUC', 'LEUD',
    'LEUE', 'LEUF', 'LEUG', 'LEUH', 'LEUI', 'LEUJ', 'LEUK', 'LEUL', 'LEUM', 'LEUN',
    'LEUR', 'LEUS', 'LEUT', 'LEUZ', 'LEVB', 'LEVC', 'LEVD', 'LEVE', 'LEVF', 'LEVG',
    'LEVH', 'LEVI', 'LEVJ', 'LEVL', 'LEVN', 'LEVO', 'LEVP', 'LEVR', 'LEVS', 'LEVT',
    'LEVU', 'LEVV', 'LEVX', 'LEVY', 'LEVZ', 'LEWG', 'LEXA', 'LEXE', 'LEXJ', 'LEXN',
    'LEXO', 'LEXU', 'LEZA', 'LEZG', 'LEZL', 'LEZO', 'LEZS', 'LEZU', 'LXGB'
];

export const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzH5fzXMHloasIxfKtZrl5uKmfI0K2tETMsWXIappsdWHAd3OYZGr08C6W8uSAyXl8b/exec';
