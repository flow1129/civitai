import { trpc } from '~/utils/trpc';
import { EventInput } from '~/server/schema/event.schema';
import dayjs from 'dayjs';

export const useQueryEvent = ({ event }: EventInput) => {
  const { data: eventData, isLoading: loadingData } = trpc.event.getData.useQuery({ event });
  const { data: teamScores = [], isLoading: loadingScores } = trpc.event.getTeamScores.useQuery({
    event,
  });
  const { data: teamScoresHistory = [], isLoading: loadingHistory } =
    trpc.event.getTeamScoreHistory.useQuery({
      event,
      window: 'hour',
      start: dayjs().subtract(3, 'days').startOf('hour').toDate(),
    });
  const { data: eventCosmetic, isLoading: loadingCosmetic } = trpc.event.getCosmetic.useQuery({
    event,
  });
  const { data: rewards = [], isLoading: loadingRewards } = trpc.event.getRewards.useQuery({
    event,
  });
  const { data: userRank, isLoading: loadingUserRank } = trpc.event.getUserRank.useQuery(
    { event },
    { enabled: eventCosmetic?.available && eventCosmetic?.obtained && eventCosmetic?.equipped }
  );
  const { data: partners, isLoading: loadingPartners } = trpc.event.getPartners.useQuery({
    event,
  });

  return {
    eventData,
    teamScores,
    teamScoresHistory,
    eventCosmetic,
    rewards,
    userRank,
    partners,
    loading: loadingScores || loadingCosmetic || loadingData,
    loadingHistory,
    loadingRewards,
    loadingUserRank,
    loadingPartners,
  };
};
export type EventPartners = ReturnType<typeof useQueryEvent>['partners'];

export const useMutateEvent = () => {
  const queryUtils = trpc.useContext();

  const activateCosmeticMutation = trpc.event.activateCosmetic.useMutation({
    onSuccess: async (_, payload) => {
      await queryUtils.event.getCosmetic.invalidate({ event: payload.event });
    },
  });
  const donateMutation = trpc.event.donate.useMutation({
    onSuccess: async (result, payload) => {
      if (!result) return;

      queryUtils.event.getTeamScores.setData({ event: payload.event }, (old) => {
        if (!old) return old;

        return old.map((teamScore) =>
          teamScore.team === result.team
            ? { ...teamScore, score: teamScore.score + payload.amount }
            : teamScore
        );
      });
    },
  });

  const handleActivateCosmetic = (payload: EventInput) => {
    return activateCosmeticMutation.mutateAsync(payload);
  };

  const handleDonate = (payload: EventInput & { amount: number }) => {
    return donateMutation.mutateAsync(payload);
  };

  return {
    activateCosmetic: handleActivateCosmetic,
    donate: handleDonate,
    equipping: activateCosmeticMutation.isLoading,
    donating: donateMutation.isLoading,
  };
};

export const useQueryEventContributors = ({ event }: { event: string }) => {
  const { data: contributors, isLoading } = trpc.event.getContributors.useQuery({ event });

  return { contributors, loading: isLoading };
};
