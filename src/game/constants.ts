// Game constants
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 500;

export const GRAVITY = 0.55;
export const JUMP_FORCE = -14;
export const DOUBLE_JUMP_FORCE = -12;
export const MAX_JUMPS = 2;
export const MOVE_SPEED = 5;
export const MAX_FALL_SPEED = 12;

export const PLAYER_WIDTH = 80;
export const PLAYER_HEIGHT = 80;

export const BEER_WIDTH = 50;
export const BEER_HEIGHT = 65;

export const PLATFORM_HEIGHT = 20;

export const GROUND_Y = CANVAS_HEIGHT - 40;

export const SCROLL_THRESHOLD = 350;

// === Level 1 (Cabinet 14) ===
export const L1_LEVEL_WIDTH = 8000;
export const L1_BOSS_ARENA_LEFT = 7000;
export const L1_BOSS_ARENA_RIGHT = 7950;

// === Level 2 (Bar "13 Rules") ===
export const L2_LEVEL_WIDTH = 8000;
export const L2_BOSS_ARENA_LEFT = 7000;
export const L2_BOSS_ARENA_RIGHT = 7950;

// Boss dimensions
export const BOSS_WIDTH = 100;
export const BOSS_HEIGHT = 120;

// Boss HP per level
export const L1_BOSS_HP = 3;
export const L2_BOSS_HP = 5;

// Colors
export const SKY_COLOR = '#87CEEB';
export const GROUND_COLOR = '#8B4513';
export const PLATFORM_COLOR = '#654321';
export const BRICK_COLOR = '#CD853F';

// === Story text pages ===
export const STORY_PROLOGUE: string[] = [
  'В далёкой стране АМБИРЛЕНДИЯ\nживёт народ, чья главная гордость —\nлегендарное золотое пиво\n\n"AMBIRLAND"',
  'Секретный рецепт варят\nуже 300 лет.\n\nНо однажды бочки с пивом\nстали пропадать одна за другой...',
  'На дело отправили\nлучшего агента отдела ФСБ.\n\nЕго кодовое имя —\nКРАСНЫЙ КРАБ.',
  'Его задача:\nпройти все точки врагов,\nсобрать украденные банки\n\nи вычислить главного заговорщика.',
  'Первый след ведёт\nв Кабинет 14 —\nстарый допросный отдел.\n\nТам ждёт Толстый Генерал,\nкоторый видел бочки последним...',
];

export const STORY_INTERLUDE: string[] = [
  'ГЕНЕРАЛ ПОВЕРЖЕН!\n\nПод натиском клешней\nон раскололся и заговорил...',
  '"Ладно... ладно, отпусти!\nПиво уплыло в подпольный бар\n\n13 RULES"',
  '"Там всем заправляет\nдревнее чудовище...\nТУРКМЕНСКИЙ СТАРЕЦ.\n\nОн разбавляет наше Ambirland\nконтрабандным пойлом!"',
  'Краб бросился в бар.\nНастоящее пиво нужно спасти!\n\nВ баре ждут кружки-мутанты,\nживые сосиски и пьяные завсегдатаи...',
  'А в конце —\nсам Старец с бородой до земли,\nкидающий пиалы кумыса\nи призывающий джиннов из бутылки.\n\nБитва за Ambirland продолжается!',
];

export const STORY_FINALE: string[] = [
  'СТАРЕЦ ПОВЕРЖЕН!\n\nЕго борода срезана,\nконтрабандные бочки разбиты,\nнастоящий рецепт Ambirland —\nспасён!',
  'Народ Амбирлендии ликует.\nЗолотое пиво снова течёт\nв честные бокалы.',
  'Красный Краб получает\nвысшую награду —\n\nмедаль "Герой Пенного Отечества"\nи звание ПОЛКОВНИКА ФСБ.',
  'Но где-то в тени мира\nуже готовится новый враг...\n\nПродолжение следует.',
];
