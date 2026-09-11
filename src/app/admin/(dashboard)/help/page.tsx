const SECTIONS = [
  { name: "Дашборд", desc: "Выручка и число заказов за сегодня, быстрые ссылки на меню." },
  { name: "Аналитика", desc: "Выручка по дням и часам, топ товаров, нал/карта, разбивка по точкам." },
  { name: "Товары", desc: "Список напитков и еды: цена, фото, категория, модификаторы." },
  { name: "Модификаторы", desc: "Группы опций вроде сиропа, сахара или молока и их цены." },
  { name: "Категории", desc: "Разделы меню, которые видны кассиру слева на кассе." },
  { name: "Ингредиенты", desc: "Состав блюд: что можно убрать или добавить за доплату." },
  { name: "Точки", desc: "Физические точки продаж и их PIN-коды для входа на кассе." },
  { name: "Возвраты", desc: "Журнал всех возвратов: что вернули, сколько и по какой причине." },
  { name: "Терминал", desc: "Настройка банковского терминала (открывать только с самой кассы)." },
  { name: "Настройки", desc: "Смена пароля админки и скачивание программы для печати чеков." },
];

export default function AdminHelpPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Справка</h1>
        <p className="mt-1 text-sm text-slate-500">Что находится в каждом разделе админ-панели.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {SECTIONS.map((s) => (
          <div key={s.name} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">{s.name}</h2>
            <p className="mt-1 text-sm text-slate-500">{s.desc}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
        Справка для кассиров по самой кассе (кнопки поиска, «Заказы», оплата) находится на
        странице{" "}
        <a href="/help" className="font-semibold text-indigo-600 hover:text-indigo-700">
          /help
        </a>
        .
      </div>
    </div>
  );
}
