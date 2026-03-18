import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import Intro from "./screens/Intro";
import Login from "./screens/Login";
import Signup from "./screens/Signup";
import Onboarding from "./screens/Onboarding";
import WorkoutHome from "./screens/WorkoutHome";
import LogWorkout from "./screens/LogWorkout";
import CreateRoutine from "./screens/CreateRoutine";
import AddExercise from "./screens/AddExercise";
import ExploreRoutines from "./screens/ExploreRoutines";
import Program from "./screens/Program";
import Profile from "./screens/Profile";


import ChatRoutine from "./screens/ChatRoutine";


import Admin from "./screens/Admin";
import AdminLogin from "./screens/AdminLogin";


import AdminUsers from "./screens/AdminUsers";


import AdminUserDetails from "./screens/AdminUserDetails";


import AdminWorkoutTemplates from "./screens/AdminWorkoutTemplates";


import AddWorkoutTemplate from "./screens/AddWorkoutTemplate";

import AdminStatistics from "./screens/AdminStatistics";



export type ExerciseItem = {
  id: string;
  name: string;
  muscle: string;
};


export type WorkoutSet = {
  kg?: number;
  reps?: number;
  intensity?: number;
  time_minutes?: number;
};

export type WorkoutExercise = ExerciseItem & {
  sets: WorkoutSet[];
};

export type WorkoutData = {
  createdAt: number;
  title: string;
  exercises: WorkoutExercise[];
};

export type SavedProgram = {
  programId: string;
  title: string;
  subtitle: string; 
  savedAt: number;
};


export type AdminUser = {
  _id: string;
  email: string;
  username: string;
  password_hash: string;
  role: "admin" | "user";
  is_active: boolean;
  created_at: string;
  last_login_at: string;
  profile: {
    age: number;
    height_cm: number;
    weight_kg: number;
    sex: string;
    goal: string;
  };
  preferences: {
    units: string;
    privacy: { store_chat_history: boolean };
  };
};

export type RootStackParamList = {
  Intro: undefined;
  Login: undefined;
  Signup: undefined;
  Onboarding: undefined;

  
  WorkoutHome:
    | {
        refreshAt?: number;
        savedProgram?: SavedProgram;
      }
    | undefined;

  LogWorkout:
    | {
        selectedExercises?: ExerciseItem[];
        startFresh?: boolean;
        mode?: "create_routine" | "log_workout";
        templateName?: string;
      }
    | undefined;

  CreateRoutine:
    | {
        selectedExercises?: ExerciseItem[];
        startFresh?: boolean;
      }
    | undefined;

  AddExercise: { existingExercises?: ExerciseItem[]; returnTo?: string; title?: string; targetMuscle?: string } | undefined;


  ExploreRoutines: undefined;
  Program:
  | {
      programId: string;
      viewOnly?: boolean;
      title?: string;
      subtitle?: string;
      targetMuscle?: string;
      exercises?: Array<{ id: string; name: string; muscle: string }>;
    }
  | undefined;

 
  Profile: undefined;

  ChatRoutine: undefined;

  AdminLogin: undefined;
  Admin: undefined;

  AdminUsers: undefined;

  AdminUserDetails: { user: AdminUser };

  AdminWorkoutTemplates:
    | {
        newTemplate?: {
          id: string;
          title: string;
          subtitle: string;
          level: "Beginner" | "Medium" | "Advanced";
          goal: "Gain Muscle" | "Strength" | "Lose Weight";
          typeLabel: string;
        };
      }
    | undefined;

  
  AddWorkoutTemplate: { selectedExercises?: ExerciseItem[] } | undefined;


  AdminStatistics: undefined;
};


const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Intro" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Intro" component={Intro} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Signup" component={Signup} />
        <Stack.Screen name="Onboarding" component={Onboarding} />
        <Stack.Screen name="WorkoutHome" component={WorkoutHome} />
        <Stack.Screen name="LogWorkout" component={LogWorkout} />
        <Stack.Screen name="CreateRoutine" component={CreateRoutine} />
        <Stack.Screen name="AddExercise" component={AddExercise} />

        
        <Stack.Screen name="ExploreRoutines" component={ExploreRoutines} />
        <Stack.Screen name="Program" component={Program} />
        <Stack.Screen name="Profile" component={Profile} />

        
        <Stack.Screen name="ChatRoutine" component={ChatRoutine} />

        <Stack.Screen name="AdminLogin" component={AdminLogin} />

        <Stack.Screen name="Admin" component={Admin} />

        <Stack.Screen name="AdminUsers" component={AdminUsers} />

        <Stack.Screen name="AdminUserDetails" component={AdminUserDetails} />

        <Stack.Screen name="AdminWorkoutTemplates" component={AdminWorkoutTemplates} />

        <Stack.Screen name="AddWorkoutTemplate" component={AddWorkoutTemplate} />

        <Stack.Screen name="AdminStatistics" component={AdminStatistics} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
