import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ActionItemStatus } from "./action-item-status";

const statusVariant: Record<
  string,
  "default" | "secondary" | "outline"
> = {
  open: "outline",
  "in-progress": "default",
  done: "secondary",
  cancelled: "secondary",
};

interface Props {
  item: {
    id: string;
    description: string;
    status: string;
    priority: string | null;
    dueDate: Date | null;
    people: { person: { name: string } }[];
    project: { name: string } | null;
    interaction: { id: string; subject: string } | null;
  };
}

export function ActionItemCard({ item }: Props) {
  const now = new Date();
  const isOverdue = item.dueDate
    && item.dueDate < now
    && item.status !== "done"
    && item.status !== "cancelled";

  return (
    <Card className={isOverdue ? "border-destructive/30" : ""}>
      <CardContent
        className="flex items-center justify-between py-4">
        <div>
          <div className="font-medium">{item.description}</div>
          <div className="text-sm text-muted-foreground">
            {item.dueDate && (
              <span className={
                isOverdue ? "text-destructive" : ""
              }>
                Due {item.dueDate.toLocaleDateString()}
              </span>
            )}
            {item.people.length > 0 && (
              <>
                {item.dueDate && " \u00B7 "}
                {item.people
                  .map((p) => p.person.name).join(", ")}
              </>
            )}
            {item.interaction && (
              <>
                {" \u00B7 "}
                <Link
                  href={
                    `/interactions/${item.interaction.id}`
                  }
                  className="underline hover:text-foreground">
                  {item.interaction.subject}
                </Link>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {item.priority && (
            <Badge variant="outline">{item.priority}</Badge>
          )}
          <Badge variant={
            statusVariant[item.status] ?? "outline"
          }>
            {item.status}
          </Badge>
          {item.project && (
            <Badge variant="secondary">
              {item.project.name}
            </Badge>
          )}
          <ActionItemStatus
            id={item.id} status={item.status} />
        </div>
      </CardContent>
    </Card>
  );
}
