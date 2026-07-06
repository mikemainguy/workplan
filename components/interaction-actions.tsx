import { Badge } from "@/components/ui/badge";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { AddActionItem } from "./add-action-item";
import { ActionItemStatus } from "./action-item-status";

interface ActionItemData {
  id: string;
  description: string;
  status: string;
  dueDate: Date | null;
  people: { person: { name: string } }[];
}

interface Props {
  interactionId: string;
  projectId?: string;
  personIds: string[];
  actionItems: ActionItemData[];
}

export function InteractionActions(
  { interactionId, projectId, personIds, actionItems }: Props
) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            Action Items ({actionItems.length})
          </CardTitle>
          <AddActionItem
            interactionId={interactionId}
            projectId={projectId}
            personIds={personIds}
          />
        </div>
      </CardHeader>
      <CardContent>
        {actionItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No action items yet.
          </p>
        ) : (
          <div className="space-y-2">
            {actionItems.map((item) => (
              <div key={item.id}
                className="flex items-center justify-between
                  rounded-md border p-3">
                <div>
                  <div className="text-sm font-medium">
                    {item.description}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {item.dueDate &&
                      `Due ${item.dueDate.toLocaleDateString()}
                        \u00B7 `}
                    {item.people
                      .map((p) => p.person.name).join(", ")}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {item.status}
                  </Badge>
                  <ActionItemStatus
                    id={item.id} status={item.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
