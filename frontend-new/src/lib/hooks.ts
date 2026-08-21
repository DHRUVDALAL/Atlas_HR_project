import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { OfferRecord } from "@/lib/types";

export function useOffer(candidateId: string | undefined) {
  return useQuery({
    queryKey: ["offer", "candidate", candidateId],
    queryFn: () =>
      api<{ offer: OfferRecord }>(`/api/offers/candidate/${candidateId}`).then(
        (r) => r.offer ?? null,
      ),
    enabled: !!candidateId,
    staleTime: 30_000,
  });
}

export function useSendOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ offerId }: { offerId: string }) =>
      api(`/api/offers/${offerId}/send`, { method: "POST" }),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["offer", "candidate"] });
      qc.invalidateQueries({ queryKey: ["offers"] });
    },
  });
}

export function useAcceptOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ offerId }: { offerId: string }) =>
      api(`/api/offers/${offerId}/accept`, { method: "POST" }),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["offer", "candidate"] });
      qc.invalidateQueries({ queryKey: ["offers"] });
    },
  });
}

export function useDeclineOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ offerId }: { offerId: string }) =>
      api(`/api/offers/${offerId}/decline`, { method: "POST" }),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["offer", "candidate"] });
      qc.invalidateQueries({ queryKey: ["offers"] });
    },
  });
}
