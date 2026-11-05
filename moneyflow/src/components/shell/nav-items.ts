export const NAV = [
  { href: "/", label: "Dashboard", icon: "home" },
  { href: "/paycheck", label: "My Paycheck", icon: "wallet" },
  { href: "/budget", label: "Budget", icon: "pie" },
  { href: "/transactions", label: "Transactions", icon: "swap" },
  { href: "/accounts", label: "Accounts", icon: "bank" },
  { href: "/bills", label: "Bills", icon: "calendar" },
  { href: "/cashflow", label: "Cash Flow", icon: "trend" },
  { href: "/debt", label: "Debt", icon: "card" },
  { href: "/goals", label: "Goals", icon: "target" },
  { href: "/investments", label: "Investments", icon: "chart" },
  { href: "/settings", label: "Settings", icon: "settings" },
] as const;

export const MOBILE_NAV = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/paycheck", label: "Paycheck", icon: "wallet" },
  { href: "/transactions", label: "Activity", icon: "swap" },
  { href: "/budget", label: "Budget", icon: "pie" },
  { href: "/more", label: "More", icon: "grid" },
] as const;
