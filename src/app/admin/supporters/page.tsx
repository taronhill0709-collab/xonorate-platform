import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

export default async function AdminSupportersPage() {
  const rows = await db
    .select({ id: users.id, name: users.name, email: users.email, createdAt: users.createdAt })
    .from(users)
    .where(eq(users.role, "supporter"))
    .orderBy(desc(users.createdAt));

  return (
    <div>
      <h1 className="font-serif text-2xl text-foreground">Supporters</h1>
      <p className="mt-1 text-sm text-muted">
        {rows.length.toLocaleString()} supporter account{rows.length === 1 ? "" : "s"}
      </p>
      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-muted">No supporter accounts yet.</p>
      ) : (
        <table className="mt-6 w-full text-left text-sm">
          <thead className="text-muted">
            <tr className="border-b border-border">
              <th className="py-2 font-medium">Name</th>
              <th className="py-2 font-medium">Email</th>
              <th className="py-2 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-border">
                <td className="py-2 text-foreground">{row.name ?? "—"}</td>
                <td className="py-2 text-foreground">{row.email}</td>
                <td className="py-2 text-muted">
                  {row.createdAt.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
