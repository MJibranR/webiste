import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard-shell";
import { SectionTitle } from "@/components/shell";
import { useAuth } from "@/lib/auth";
import { fetchPurchases, type Purchase } from "@/lib/spiderhex";

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
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPurchases() {
      if (!user) return;
      setLoading(true);
      try {
        const data = await fetchPurchases();
        const userPurchases = data.filter((p) => p.userId === user.id);
        setPurchases(userPurchases);
      } catch (error) {
        console.error('Error loading purchases:', error);
        toast.error('Failed to load purchases');
      } finally {
        setLoading(false);
      }
    }
    loadPurchases();
  }, [user]);

  if (!user) return null;

  if (loading) {
    return (
      <DashboardShell>
        <div className="flex justify-center items-center py-20">
          <p className="text-sm text-muted-foreground">LOADING...</p>
        </div>
      </DashboardShell>
    );
  }

  const mine = [...purchases].reverse();

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
                        p.status === "active" ? "border-primary/60 text-primary" : 
                        p.status === "pending" ? "border-gold/60 text-gold" :
                        "border-danger/60 text-danger"
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