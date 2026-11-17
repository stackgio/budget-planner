import { appContext } from "@/server/context";
import { ensureGrowthDefaults } from "@/server/growth";
import { GrowthTabs } from "./GrowthTabs";

export default async function GoalsLayout({ children }: { children: React.ReactNode }) {
  const { user } = await appContext();
  await ensureGrowthDefaults(user.id);
  return (<div><GrowthTabs />{children}</div>);
}
