import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { SectionTitle } from "@/components/shell";
import { useAuth } from "@/lib/auth";
import { useLive } from "@/lib/use-live";

export const Route = createFileRoute("/dashboard/purchases")({
  component: () => (
    <DashboardShell>
      <Purchases />
    </DashboardShell>
  ),
  head: () => ({
    meta: [
      { title: "Purchase History — SPIDER HEX" },
      { name: "description", content: "Review every SPIDER HEX panel purchase with price, date and license status." },
      { property: "og:title", content: "Purchase History — SPIDER HEX" },
      { property: "og:description", content: "Every order you have placed on SPIDER HEX." },
    ],
  }),
});

function Purchases() {
  const { user } = useAuth();
  const { purchases } = useLive();
  if (!user) return null;
  const mine = [...purchases.filter((p) => p.userId === user.id)].reverse();

  return (
    <>
      <SectionTitle sub="// COMPLETE ORDER LOG">PURCHASE HISTORY</SectionTitle>
      {mine.length === 0 ? (
        <div className="panel p-10 text-center text-xs text-muted-foreground">
          NO PURCHASES YET —{" "}
          <Link to="/store" className="text-primary hover:underline">
            GO TO STORE
          </Link>
        </div>
      ) : (
        <div className="panel overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-xs">
            <thead className="text-[10px] tracking-[0.2em] text-muted-foreground">
              <tr className="border-b border-border">
                <th className="p-4">PRODUCT</th>
                <th className="p-4">PRICE</th>
                <th className="p-4">DATE</th>
                <th className="p-4">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {mine.map((p) => (
                <tr key={p.id} className="border-b border-border/50 last:border-0">
                  <td className="p-4 text-primary">{p.productName}</td>
                  <td className="p-4">${p.price}</td>
                  <td className="p-4 text-muted-foreground">{new Date(p.purchaseDate).toLocaleDateString()}</td>
                  <td className="p-4">
                    <span
                      className={`rounded border px-2 py-1 text-[10px] ${
                        p.status === "active" ? "border-primary/60 text-primary" : "border-danger/60 text-danger"
                      }`}
                    >
                      {p.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
