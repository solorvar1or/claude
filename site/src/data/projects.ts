import type { CategoryId } from './categories';

// Portfolio. The entries below are DEMO templates (demo: true) that show the
// page structure; replace them with real projects before launch.
// Images: put files in public/projects/<slug>/ and list them in `photos`.
// While `photos` is empty, neutral placeholders are rendered.

export type ObjectType = 'Квартира' | 'Новостройка' | 'Дом' | 'Коммерческий объект';

export interface Photo {
  src: string;
  alt: string;
}

export interface Project {
  slug: string;
  demo?: boolean;
  title: string; // H1: «[Тип мебели] [особенность] — [объект]»
  category: CategoryId;
  object: ObjectType;
  feature: string; // one line for cards
  district?: string;
  featured?: boolean; // shown on the home page
  facts: { label: string; value: string }[];
  task: string;
  room?: string;
  solution: string;
  materials: { title: string; text: string }[];
  details: string[];
  process?: string;
  result: string;
  review?: { text: string; author: string };
  cover?: Photo;
  photos: Photo[];
}

const demoFacts = (furniture: string) => [
  { label: 'Тип мебели', value: furniture },
  { label: 'Размер', value: '[[Длина / площадь]]' },
  { label: 'Корпус', value: '[[Материал корпуса]]' },
  { label: 'Фасады', value: '[[Материал фасадов]]' },
  { label: 'Фурнитура', value: '[[Производитель фурнитуры]]' },
  { label: 'Срок изготовления', value: '[[Если раскрывается]]' },
];

const demoBody = {
  task: '[[Кто клиенты и в какой ситуации обратились: переезд, ремонт, новостройка]]. [[Какую задачу нужно было решить]]. [[Что было важно: много хранения, спрятать технику, лёгкий внешний вид]].',
  room: '[[Площадь и форма помещения]]. [[Ограничения: короба, неровные стены, окно, коммуникации, низкий потолок]].',
  solution: '[[Какое решение предложили]]. [[Почему именно так]]. [[Как решили ограничения помещения]].',
  materials: [
    { title: '[[Материал фасадов]]', text: '[[Почему выбран: практичность, цвет, тактильность]]' },
    { title: '[[Материал столешницы / корпуса]]', text: '[[Почему выбран]]' },
  ],
  details: ['[[Система хранения]]', '[[Механизм открывания]]', '[[Подсветка]]', '[[Нестандартный элемент]]'],
  process: '[[Как проект изготавливали и монтировали: 2–3 предложения и фото из цеха]]',
  result: '[[Что в итоге получил клиент — одно-два предложения]]',
};

export const projects: Project[] = [
  {
    slug: 'uglovaya-kuhnya-primer',
    demo: true,
    featured: true,
    title: 'Угловая кухня с островом — новостройка',
    category: 'kuhni',
    object: 'Новостройка',
    feature: '[[Главная особенность проекта]]',
    district: '[[Район, если клиент согласен]]',
    facts: [...demoFacts('Кухня'), { label: 'Столешница', value: '[[Материал столешницы]]' }],
    ...demoBody,
    review: { text: '[[Отзыв клиента — дословно, с согласия]]', author: '[[Имя клиента]]' },
    photos: [],
  },
  {
    slug: 'pryamaya-kuhnya-primer',
    demo: true,
    featured: true,
    title: 'Прямая кухня до потолка — квартира',
    category: 'kuhni',
    object: 'Квартира',
    feature: '[[Главная особенность проекта]]',
    facts: demoFacts('Кухня'),
    ...demoBody,
    photos: [],
  },
  {
    slug: 'vstroennyj-shkaf-primer',
    demo: true,
    featured: true,
    title: 'Встроенный шкаф в нишу — квартира',
    category: 'shkafy',
    object: 'Квартира',
    feature: '[[Главная особенность проекта]]',
    facts: demoFacts('Шкаф'),
    ...demoBody,
    photos: [],
  },
  {
    slug: 'garderobnaya-primer',
    demo: true,
    featured: true,
    title: 'Гардеробная комната — дом',
    category: 'garderobnye',
    object: 'Дом',
    feature: '[[Главная особенность проекта]]',
    facts: demoFacts('Гардеробная'),
    ...demoBody,
    photos: [],
  },
  {
    slug: 'prihozhaya-primer',
    demo: true,
    title: 'Прихожая с системой хранения — новостройка',
    category: 'prihozhie',
    object: 'Новостройка',
    feature: '[[Главная особенность проекта]]',
    facts: demoFacts('Прихожая'),
    ...demoBody,
    photos: [],
  },
  {
    slug: 'detskaya-primer',
    demo: true,
    title: 'Мебель для детской — квартира',
    category: 'detskie',
    object: 'Квартира',
    feature: '[[Главная особенность проекта]]',
    facts: demoFacts('Детская'),
    ...demoBody,
    photos: [],
  },
];

export const projectUrl = (p: Project) => `/proekty/${p.slug}/`;
export const projectsBy = (ids: CategoryId[]) => projects.filter((p) => ids.includes(p.category));
export const featuredProjects = () => projects.filter((p) => p.featured);
export const relatedProjects = (p: Project, n = 3) =>
  [...projects.filter((x) => x.slug !== p.slug && x.category === p.category),
   ...projects.filter((x) => x.slug !== p.slug && x.category !== p.category)].slice(0, n);
