import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export interface DimensionScore {
  rating: number;
  remarks: string;
}
export type Scorecard = Record<string, DimensionScore>;

export function useScorecard(dimensions: readonly string[]) {
  const [state, setState] = useState<Scorecard>(() =>
    Object.fromEntries(dimensions.map((d) => [d, { rating: 0, remarks: "" }])),
  );
  const update = (dim: string, patch: Partial<DimensionScore>) =>
    setState((prev) => ({ ...prev, [dim]: { ...prev[dim], ...patch } }));
  const isComplete = dimensions.every((d) => (state[d]?.rating ?? 0) > 0);
  return { state, update, isComplete };
}

export function ScorecardEditor({
  dimensions,
  scorecard,
  onUpdate,
}: {
  dimensions: readonly string[];
  scorecard: Scorecard;
  onUpdate: (dim: string, patch: Partial<DimensionScore>) => void;
}) {
  return (
    <div className="space-y-4">
      {dimensions.map((dim) => {
        const v = scorecard[dim] ?? { rating: 0, remarks: "" };
        return (
          <Card key={dim} className="p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <Label className="text-sm font-medium">{dim}</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => onUpdate(dim, { rating: n })}
                    className={cn(
                      "h-9 w-9 rounded-md border text-sm font-medium transition-colors",
                      v.rating >= n
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background hover:bg-accent",
                    )}
                    aria-label={`${n} out of 5`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <Textarea
              placeholder="Remarks (optional)"
              value={v.remarks}
              onChange={(e) => onUpdate(dim, { remarks: e.target.value })}
              className="mt-3 min-h-[70px]"
            />
          </Card>
        );
      })}
    </div>
  );
}
