import styles from "./footer-nav.module.css";

const items = [
  { label: "ホーム", icon: "🏠", href: "#top" },
  { label: "検索履歴", icon: "🗂", href: "#history" },
  { label: "使い方", icon: "📖", href: "#howto" },
  { label: "サポート", icon: "🤝", href: "#help" }
];

export const FooterNav = () => {
  return (
    <nav className={styles.nav}>
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.label}>
            <a href={item.href} className={styles.link}>
              <span aria-hidden>{item.icon}</span>
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};
