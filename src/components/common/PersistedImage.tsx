import React, { useEffect, useState } from 'react';
import { Image, type ImageProps } from 'react-native';
import { resolveImage } from '../../services/MediaService';

export default function PersistedImage({ uri, ...props }: Omit<ImageProps, 'source'> & { uri: string }) {
  const [resolved, setResolved] = useState<string>();
  useEffect(() => {
    let active = true;
    setResolved(undefined);
    resolveImage(uri).then(value => { if (active) setResolved(value); }).catch(() => {});
    return () => { active = false; };
  }, [uri]);
  return <Image {...props} source={resolved ? { uri: resolved } : undefined} />;
}
