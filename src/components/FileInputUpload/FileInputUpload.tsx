import { Stack, FileInput, Progress, FileInputProps, Group, Text } from '@mantine/core';
import { IconUpload, IconCircleCheck, IconBan } from '@tabler/icons';
import { useMemo } from 'react';
import { useS3Upload } from '~/hooks/useS3Upload';
import useIsClient from '~/hooks/useIsClient';
import { UploadType, UploadTypeUnion } from '~/server/common/enums';
import { formatBytes, formatSeconds } from '~/utils/number-helpers';

//TODO File Safety: Limit to the specific file extensions we want to allow
export function FileInputUpload({
  uploadType = 'default',
  onChange,
  onLoading,
  value,
  fileName = decodeURIComponent(value?.split('/').pop() ?? ''),
  ...props
}: Props) {
  const isClient = useIsClient();
  const { files, uploadToS3, resetFiles } = useS3Upload();
  const { file, progress, speed, timeRemaining, status, abort } = files[0] ?? {
    file: null,
    progress: 0,
    speed: 0,
    timeRemaining: 0,
    status: 'pending',
  };

  const handleOnChange: FileInputProps['onChange'] = async (file) => {
    // setDroppedFile(file);
    let url: string | null = null;
    if (file) {
      onLoading?.(true);
      const uploaded = await uploadToS3(file, uploadType);
      url = uploaded.url;
      onLoading?.(false);
      onChange?.(url, file);
    } else {
      resetFiles();
    }
  };

  // Create a local empty file to display value in file input when editing
  const localFile = useMemo<File | undefined>(
    () => (isClient && fileName ? new File([], fileName) : undefined),
    [fileName, isClient]
  );

  return (
    <Stack>
      <FileInput
        {...props}
        icon={<IconUpload size={16} />}
        onChange={handleOnChange}
        value={file ?? localFile}
        rightSection={
          file && (
            <>
              {status === 'success' && <IconCircleCheck color="green" size={24} />}
              {status === 'uploading' && (
                <IconBan
                  style={{ cursor: 'pointer' }}
                  color="red"
                  size={24}
                  onClick={() => abort()}
                />
              )}
            </>
          )
        }
      />
      {file && (
        <>
          {status === 'uploading' && (
            <Stack spacing={2}>
              <Progress
                sx={{ width: '100%' }}
                size="xl"
                value={progress}
                label={`${Math.floor(progress)}%`}
                color={progress < 100 ? 'blue' : 'green'}
                striped
                animate
              />
              <Group position="apart">
                <Text size="xs" color="dimmed">{`${formatBytes(speed)}/s`}</Text>
                <Text size="xs" color="dimmed">{`${formatSeconds(timeRemaining)} remaining`}</Text>
              </Group>
            </Stack>
          )}
          {status === 'error' && (
            <Text size="xs" color="red">
              Error uploading file
            </Text>
          )}
        </>
      )}
    </Stack>
  );
}

type Props = Omit<FileInputProps, 'icon' | 'onChange' | 'value'> & {
  value?: string;
  onChange?: (url: string | null, file: File | null) => void;
  onLoading?: (loading: boolean) => void;
  uploadType?: UploadType | UploadTypeUnion;
  fileName?: string;
};
