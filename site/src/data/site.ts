// Company-wide facts. Everything in [[double brackets]] is a placeholder
// that must be confirmed by WOODGER (see docs/woodger/site-architecture.md, section 10).

const city = 'Витебск';

const mapLinks = (query: string) => ({
  yandex: `https://yandex.by/maps/?text=${encodeURIComponent(query)}`,
  google: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`,
  embed: `https://yandex.by/map-widget/v1/?text=${encodeURIComponent(query)}&z=16`,
});

export const site = {
  brand: 'WOODGER',
  legalName: 'ООО «ВУДЖЕР»',
  unp: '[[УНП]]',
  legalAddress: '[[Юридический адрес]]',
  // [[НУЖНО УТОЧНИТЬ]] production domain; used for canonical URLs and sitemap.
  url: 'https://woodger.by',
  city,

  phone: {
    display: '[[+375 (XX) XXX-XX-XX]]',
    tel: '+375000000000',
  },
  email: '[[e-mail]]',
  replyTime: '[[в течение рабочего дня]]',
  replyRole: '[[менеджер]]',
  workHoursCalls: '[[Пн–Пт 9:00–18:00]]',

  // Only messengers WOODGER really uses should stay enabled.
  messengers: [
    { id: 'viber', label: 'Viber', href: 'viber://chat?number=%2B375000000000', enabled: true },
    { id: 'telegram', label: 'Telegram', href: 'https://t.me/[[username]]', enabled: true },
    { id: 'whatsapp', label: 'WhatsApp', href: 'https://wa.me/375000000000', enabled: false },
  ],

  socials: [
    { label: 'Instagram', href: 'https://instagram.com/[[account]]', enabled: true },
  ],

  salon: {
    title: 'Салон WOODGER',
    street: 'проспект Победы, 15',
    full: `${city}, проспект Победы, 15`,
    hint: '[[Этаж, вход, ориентир]]',
    hours: '[[Режим работы салона]]',
    hoursSchema: [] as string[], // e.g. ['Mo-Fr 10:00-19:00'] once confirmed
    appointment: '[[Нужна ли предварительная запись]]',
    showroom: '[[образцы фасадов, столешниц и фурнитуры]]',
    parking: '[[Парковка]]',
    transport: '[[Ближайшие остановки транспорта]]',
    maps: mapLinks(`${city}, проспект Победы, 15`),
  },

  production: {
    title: 'Производство WOODGER',
    street: 'ул. Петруся Бровки, 22Б',
    full: `${city}, ул. Петруся Бровки, 22Б`,
    hours: '[[Режим работы производства]]',
    visits: '[[Можно ли клиентам приезжать на производство]]',
    maps: mapLinks(`${city}, улица Петруся Бровки, 22Б`),
  },

  guarantee: '[[Гарантия]]',

  // Where forms are sent. public/send.php is a ready PHP handler; see site/README.md.
  formEndpoint: '/send.php',

  analytics: {
    yandexMetrikaId: '', // e.g. '12345678'
    gaMeasurementId: '', // e.g. 'G-XXXXXXX'
  },
};

export const enabledMessengers = () => site.messengers.filter((m) => m.enabled);
export const primaryMessenger = () => enabledMessengers()[0];
