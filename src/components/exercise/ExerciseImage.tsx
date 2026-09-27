import React, { useEffect, useState } from 'react';
import { Image, View, type ImageProps } from 'react-native';
import { cacheExerciseImage } from '../../services/ExerciseMediaCache';
export default function ExerciseImage({ uri, ...props }: Omit<ImageProps, 'source'> & { uri: string }) {
  const [source, setSource] = useState<string>();
  useEffect(() => {
    let active = true;
    setSource(undefined);
    cacheExerciseImage(uri).then(local => { if (active) setSource(local); }).catch(() => { if (active) setSource(uri); });
    return () => { active = false; };
  }, [uri]);
  if (!source) return <View style={props.style} />;
  return <Image {...props} source={{ uri: source }} />;
}
