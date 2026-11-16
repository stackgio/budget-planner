import { MoneyTabs } from "./MoneyTabs";
export default function MoneyLayout({ children }: { children: React.ReactNode }) {
  return (<div><MoneyTabs />{children}</div>);
}
