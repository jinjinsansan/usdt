const items = [
  { label: "ホーム", icon: "🏠", href: "#top" },
  { label: "検索履歴", icon: "🗂", href: "#history" },
  { label: "使い方", icon: "📖", href: "#howto" },
  { label: "サポート", icon: "🤝", href: "#help" }
];

export const FooterNav = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 shadow-[0_-6px_20px_rgba(15,80,150,0.08)] backdrop-blur">
      <ul className="mx-auto flex max-w-3xl items-center justify-around py-3 text-sm font-semibold text-slate-700">
        {items.map((item) => (
          <li key={item.label}>
            <a href={item.href} className="flex flex-col items-center gap-1">
              <span className="text-2xl" aria-hidden>{item.icon}</span>
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};
