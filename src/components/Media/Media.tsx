import { Box, BoxProps } from '@mantine/core';
import { useSession } from 'next-auth/react';
import React from 'react';
import { MediaCount } from './MediaCount';
import { MediaCtx, MediaTypes } from './mediaContext';
import { useNsfwStore } from './mediaStore';
import { MediaNsfwToggle } from './MediaNsfwToggle';
import { MediaContent } from './MediaContent';
import { MediaTarget } from './MediaTarget';
import { MediaPlaceholder } from './MediaPlaceholder';

type MediaProps = {
  nsfw?: boolean;
  type: MediaTypes;
  id: number;
  children?:
    | React.ReactNode
    | (({ nsfw, showNsfw }: { nsfw: boolean; showNsfw: boolean }) => React.ReactNode);
};

export function Media({
  nsfw = false,
  type,
  id,
  children,
  style,
  ...props
}: MediaProps & Omit<BoxProps, 'children'>) {
  const { data: session } = useSession();
  const shouldBlur = session?.user?.blurNsfw ?? true;
  const showNsfw = useNsfwStore(
    (state) => state[type === 'model' ? 'showModels' : 'showReviews'][id.toString()] ?? false
  );

  return (
    <MediaCtx.Provider value={{ nsfw: nsfw && shouldBlur, showNsfw, type, id }}>
      <Box style={{ position: 'relative', ...style }} {...props}>
        {typeof children === 'function' ? children({ nsfw, showNsfw }) : children}
      </Box>
    </MediaCtx.Provider>
  );
}

Media.ToggleNsfw = MediaNsfwToggle;
Media.Count = MediaCount;
Media.Content = MediaContent;
Media.Target = MediaTarget;
Media.Placeholder = MediaPlaceholder;
