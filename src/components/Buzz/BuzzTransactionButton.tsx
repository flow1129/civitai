import { Group, Text, ButtonProps, Button, Tooltip } from '@mantine/core';
import { useFeatureFlags } from '~/providers/FeatureFlagsProvider';
import React from 'react';
import { CurrencyBadge } from '~/components/Currency/CurrencyBadge';
import { Currency } from '@prisma/client';
import { IconAlertTriangleFilled } from '@tabler/icons-react';
import { useBuzzTransaction } from './buzz.utils';

type Props = ButtonProps & {
  buzzAmount: number;
  message?: string | ((requiredBalance: number) => string);
  label: string;
  onPerformTransaction?: () => void;
  purchaseSuccessMessage?: (purchasedBalance: number) => React.ReactNode;
  performTransactionOnPurchase?: boolean;
};

export function BuzzTransactionButton({
  buzzAmount,
  onPerformTransaction,
  purchaseSuccessMessage,
  message = "You don't have enough funds to perform this action.",
  performTransactionOnPurchase = true,
  label,
  ...buttonProps
}: Props) {
  const features = useFeatureFlags();
  const { conditionalPerformTransaction, hasRequiredAmount } = useBuzzTransaction({
    message,
    purchaseSuccessMessage,
    performTransactionOnPurchase,
  });

  if (!features.buzz) return null;

  const onClick = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();

    if (!onPerformTransaction) {
      return;
    }

    if (!features.buzz) {
      // Just perform whatever it is we need
      onPerformTransaction();
      return;
    }

    conditionalPerformTransaction(buzzAmount, onPerformTransaction);
  };

  return (
    <Button color="yellow.7" {...buttonProps} onClick={onPerformTransaction ? onClick : undefined}>
      <Group spacing="md" noWrap>
        <CurrencyBadge
          currency={Currency.BUZZ}
          unitAmount={buzzAmount}
          displayCurrency={false}
          radius={buttonProps?.radius ?? 'sm'}
          px="xs"
        >
          {!hasRequiredAmount(buzzAmount) && (
            <Tooltip
              label="Insufficient buzz. Click to buy more"
              style={{ textTransform: 'capitalize' }}
              maw={250}
              multiline
              withArrow
            >
              <IconAlertTriangleFilled
                color="red"
                size={12}
                fill="currentColor"
                style={{ marginRight: 4 }}
              />
            </Tooltip>
          )}
        </CurrencyBadge>
        <Text>{label}</Text>
      </Group>
    </Button>
  );
}
