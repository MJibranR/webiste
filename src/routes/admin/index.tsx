import { createFileRoute, Link } from "@tanstack/react-router";
import { Boxes, DollarSign, Download, Users } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { SectionTitle } from "@/components/shell";
import { useLive } from "@/lib/use-live";

export const Route = createFileRoute("/admin/")({
  component: () => (
    <AdminShell>
      <Overview />
    </AdminShell>
  ),
  head: () => ({
    meta: [
      { title: "Admin Overview — SPIDER HEX" },
      { name: "description", content: "Admin control center: revenue, orders, panels and member stats for SPIDER HEX." },
      { property: "og:title", content: "Admin Overview — SPIDER HEX" },
      { property: "og:description", content: "Revenue, orders, panels and member stats at a glance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function Overview() {
  const { products, purchases, users } = useLive();
  const revenue = purchases.reduce((s, p) => s + p.price, 0);
  const members = users.filter((u) => u.role === "user");
  const pending = purchases.filter((p) => !p.downloadLink).length;

  const stats = [
    { label: "TOTAL REVENUE", value: `$${revenue.toFixed(2)}`, icon: DollarSign },
    { label: "ORDERS", value: String(purchases.length), icon: Download },
    { label: "PANELS", value: String(products.length), icon: Boxes },
    { label: "MEMBERS", value: String(members.length), icon: Users },
  ];

  const recent = [...purchases].reverse().slice(0, 8);

  return (
    <>
      <SectionTitle sub="// SYSTEM STATUS">ADMIN OVERVIEW</SectionTitle>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="panel p-5">
            <p className="text-[10px] tracking-[0.2em] text-muted-foreground">
              <s.icon className="mr-2 inline h-4 w-4 text-primary" />
              {s.label}
            </p>
            <p className="glow-gold mt-3 text-3xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      {pending > 0 && (
        <div className="panel mt-6 flex flex-wrap items-center justify-between gap-3 border-danger/50 p-4">
          <p className="text-xs text-danger">{pending} ORDER(S) WAITING FOR A DOWNLOAD LINK</p>
          <Link
            to="/admin/downloads"
            className="rounded border border-danger/60 px-3 py-2 text-[11px] text-danger hover:bg-danger/10"
          >
            MANAGE LINKS
          </Link>
        </div>
      )}

      <h2 className="mt-10 text-[11px] tracking-[0.2em] text-muted-foreground">RECENT ORDERS</h2>
      <div className="panel mt-3 overflow-x-auto">
        {recent.length === 0 ? (
          <p className="p-8 text-center text-xs text-muted-foreground">NO ORDERS YET</p>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="text-[10px] tracking-[0.15em] text-muted-foreground">
              <tr className="border-b border-border">
                <th className="p-3">PANEL</th>
                <th className="p-3">BUYER</th>
                <th className="p-3">PRICE</th>
                <th className="p-3">DATE</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((p) => (
                <tr key={p.id} className="border-b border-border/50">
                  <td className="p-3 text-primary">{p.productName}</td>
                  <td className="p-3 text-muted-foreground">
                    {users.find((u) => u.id === p.userId)?.email ?? "UNKNOWN"}
                  </td>
                  <td className="p-3">${p.price}</td>
                  <td className="p-3 text-muted-foreground">
                    {new Date(p.purchaseDate).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
