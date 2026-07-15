import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";

interface TopicLink {
  id: string;
  startTime: Date;
  endTime: Date;
  summary: string | null;
  topic: { id: string; name: string };
}

interface Props {
  topics: TopicLink[];
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString([], {
    hour: "2-digit", minute: "2-digit",
  });
}

function formatDate(d: Date): string {
  return d.toLocaleDateString([], {
    month: "short", day: "numeric",
  });
}

export function InteractionTopics({ topics }: Props) {
  if (!topics.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Topics ({topics.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {topics.map((link) => (
          <Link key={link.id}
            href={`/topics/${link.topic.id}`}
            className="flex items-center
              justify-between rounded-md border
              p-3 hover:bg-accent">
            <div>
              <p className="font-medium text-sm">
                {link.topic.name}
              </p>
              {link.summary && (
                <p className="text-xs
                  text-muted-foreground mt-0.5">
                  {link.summary}
                </p>
              )}
            </div>
            <Badge variant="outline" className="ml-3
              shrink-0 text-xs">
              {formatDate(link.startTime)}{" "}
              {formatTime(link.startTime)}
              {" — "}
              {formatTime(link.endTime)}
            </Badge>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
