import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import MainTabs from './MainTabs';
import WorkoutDetailScreen from '../screens/WorkoutDetailScreen';
import WorkoutFormScreen from '../screens/WorkoutFormScreen';
import WorkoutExerciseConfigScreen from '../screens/WorkoutExerciseConfigScreen';
import ExerciseExecutionScreen from '../screens/ExerciseExecutionScreen';
import LogDetailScreen from '../screens/LogDetailScreen';
import ExerciseProgressScreen from '../screens/ExerciseProgressScreen';
import { colors } from '../theme';
import type { RootStackParamList } from './types';

const Stack = createStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700', color: colors.text },
        headerShadowVisible: false,
        cardStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="WorkoutDetail"
        component={WorkoutDetailScreen}
        options={{ title: 'Treino' }}
      />
      <Stack.Screen
        name="WorkoutForm"
        component={WorkoutFormScreen}
        options={{ title: '', headerBackTitle: 'Voltar' }}
      />
      <Stack.Screen
        name="WorkoutExerciseConfig"
        component={WorkoutExerciseConfigScreen}
        options={{ title: 'Configurar exercício', headerBackTitle: 'Voltar' }}
      />
      <Stack.Screen
        name="ExerciseExecution"
        component={ExerciseExecutionScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="LogDetail"
        component={LogDetailScreen}
        options={{ title: 'Treino realizado' }}
      />
      <Stack.Screen
        name="ExerciseProgress"
        component={ExerciseProgressScreen}
        options={{ title: '' }}
      />
    </Stack.Navigator>
  );
}
