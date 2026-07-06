import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { ActionItemCard } from "@/components/action-item-card";

export default async function ActionsPage() {
  const actionItems = await prisma.actionItem.findMany({
    orderBy: [
      { status: "asc" },
      { dueDate: "asc" },
      { createdAt: "desc" },
    ],
    include: {
      people: { include: { person: true } },
      project: true,
      interaction: true,
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Action Items</h1>

      {actionItems.length === 0 ? (
        <Card>
          <CardContent
            className="py-8 text-center text-muted-foreground">
            No action items yet. They&apos;ll appear here
            when created from interactions.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {actionItems.map((item) => (
            <ActionItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
