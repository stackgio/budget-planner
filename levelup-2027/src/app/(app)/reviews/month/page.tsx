import { appContext } from "@/server/context";
import { reviewData } from "@/server/reviews";
import { isLocalDate } from "@/domain/dates";
import { ReviewView } from "../ReviewView";

export default async function MonthlyReview({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const { user, tz, today } = await appContext();
  const sp = await searchParams;
  const d = await reviewData(user.id, tz, "MONTH", sp.date && isLocalDate(sp.date) && sp.date <= today ? sp.date : today, today);
  return <ReviewView d={d} today={today} />;
}
