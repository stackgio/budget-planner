import Link from "next/link";
export default function NotFound() {
  return <div className="py-16 text-center"><p className="text-lg font-semibold">Not found</p><Link href="/" className="mt-2 inline-block text-brand">Back to dashboard</Link></div>;
}
