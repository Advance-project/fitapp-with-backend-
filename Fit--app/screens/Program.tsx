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

type Route = {
  key: string;
  name: string;
  params?: {
    programId: string;
    viewOnly?: boolean;
    title?: string;
    subtitle?: string;
  };
};

export default function Program() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();

  const programId = route.params?.programId ?? "";
  const viewOnly = route.params?.viewOnly === true;

  const title = route.params?.title ?? "Chest";
  const subtitle = route.params?.subtitle ?? "2";

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
              <Text style={styles.coverThumbText}>{title}</Text>
            </View>

            <Text style={styles.programName}>{title}</Text>

            <Text style={styles.routineCount}>{subtitle} exercise</Text>
          </View>

          <Text style={styles.section}>Routines</Text>

          <View style={styles.routineBlock}>
            <View style={styles.routineTop}>
              <Text style={styles.routineTitle}>{title}</Text>
            </View>

            {[
              "Bench Press (Barbell)",
              "Incline Dumbbell Press",
            ].map((x) => (
              <View key={x} style={styles.exerciseRow}>
                <View style={styles.exerciseIcon}>
                  <Text style={{ fontSize: 18 }}>🏋️</Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.exerciseNameBlue}>{x}</Text>
                  <Text style={styles.exerciseSub}>3 sets · 12–15 reps</Text>
                </View>
              </View>
            ))}
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
    width: 150,
    height: 120,
    borderRadius: 18,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  coverThumbText: {
    fontWeight: "900",
    color: "#1e88e5",
    textAlign: "center",
    fontSize: 18,
  },

  programName: {
    fontSize: 24,
    fontWeight: "900",
    color: "#0b1220",
  },

  routineCount: {
    marginTop: 12,
    fontSize: 18,
    color: "#111827",
    fontWeight: "800",
  },

  section: {
    marginTop: 18,
    fontSize: 18,
    fontWeight: "800",
    color: "#9aa3af",
  },

  routineBlock: {
    marginTop: 18,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#eef2f7",
  },

  routineTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  routineTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0b1220",
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