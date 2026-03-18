import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../App";

type Nav = NativeStackNavigationProp<RootStackParamList, "Program">;

function shortTargetMuscle(label: string): string {
  const map: Record<string, string> = {
    "Chest": "C",
    "Back": "B",
    "Shoulder": "S",
    "Bicep / Back": "Bi/B",
    "Chest / Tricep": "C/Tri",
    "Shoulder / Abs": "S/Abs",
    "Chest / Back / Shoulder / Bicep / Tricep": "UB (C/B/S/Bi/Tri)",
    "Chest / Shoulder / Tricep": "Push (C/S/Tri)",
    "Back / Bicep / Shoulder": "Pull (B/Bi/S)",
  };
  return map[label] ?? label;
}

type Route = {
  key: string;
  name: string;
  params?: {
    programId: string;
    viewOnly?: boolean;
    title?: string;
    subtitle?: string;
    targetMuscle?: string;
    exercises?: Array<{ id: string; name: string; muscle: string }>;
  };
};

export default function Program() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();

  const title = route.params?.title ?? "Program";
  const exercises = route.params?.exercises ?? [];
  const coverLabel = shortTargetMuscle(route.params?.targetMuscle ?? title);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerLeft}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Program</Text>

          <View style={styles.headerRight} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.coverWrap}>
            <View style={styles.coverThumb}>
              <Text style={styles.coverThumbText} numberOfLines={1} ellipsizeMode="tail">
                {coverLabel}
              </Text>
            </View>

            <Text style={styles.programName}>{title}</Text>

            <Text style={styles.routineCount}>
              {exercises.length} {exercises.length === 1 ? "exercise" : "exercises"}
            </Text>
          </View>

          <View style={styles.routineBlock}>
            {exercises.length === 0 ? (
              <Text style={styles.exerciseSub}>No exercises added.</Text>
            ) : (
              exercises.map((ex) => (
                <View key={ex.id} style={styles.exerciseRow}>
                  <View style={styles.exerciseIcon}>
                    <Text style={{ fontSize: 18 }}>🏋️</Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.exerciseNameBlue}>{ex.name}</Text>
                    <Text style={styles.exerciseSub}>{ex.muscle}</Text>
                  </View>
                </View>
              ))
            )}
          </View>

          <View style={{ height: 30 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  screen: { flex: 1, backgroundColor: "#fff" },

  header: {
    paddingTop: 14,
    paddingBottom: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerLeft: { width: 44, height: 36, justifyContent: "center" },
  backArrow: { fontSize: 26, color: "#111827", fontWeight: "600" },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  headerRight: { width: 44, alignItems: "flex-end" },

  content: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 16 },

  coverWrap: { paddingBottom: 10 },

  coverThumb: {
    width: 160,
    height: 90,
    borderRadius: 14,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    paddingHorizontal: 10,
  },

  coverThumbText: {
    fontWeight: "900",
    color: "#1e88e5",
    textAlign: "center",
    fontSize: 13,
  },

  programName: {
    fontSize: 24,
    fontWeight: "900",
    color: "#0b1220",
  },

  routineCount: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: "800",
    color: "#6b7280",
  },

  routineBlock: {
    marginTop: 24,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#eef2f7",
  },

  exerciseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 18,
  },

  exerciseIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },

  exerciseNameBlue: {
    fontSize: 18,
    fontWeight: "900",
    color: "#1e88e5",
  },

  exerciseSub: {
    marginTop: 6,
    color: "#9aa3af",
    fontWeight: "700",
  },
});