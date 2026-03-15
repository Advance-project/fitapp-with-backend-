import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { isAdminAuthenticated } from "./userStore";

type ProgramItem = {
  id: string;
  title: string;
  subtitle: string;
  targetMuscle: string;
};

export default function AdminWorkoutTemplates() {
  const navigation = useNavigation<any>();

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      navigation.replace("AdminLogin");
    }
  }, [navigation]);

  const [programs, setPrograms] = useState<ProgramItem[]>([
    {
      id: "default_template_1",
      title: "C",
      subtitle: "2",
      targetMuscle: "Chest",
    },
  ]);

  const handleAddTemplate = (newTemplate: ProgramItem) => {
    setPrograms((prev) => [...prev, newTemplate]);
    navigation.goBack();
  };

  const handleRemove = (id: string) => {
    setPrograms((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.headerLeft}
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Manage workout templates</Text>

          <View style={styles.headerRight} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.pageTitle}>Workout templates</Text>

          <TouchableOpacity
            style={styles.addBtn}
            onPress={() =>
              navigation.navigate("AddWorkoutTemplate", {
                onSaveTemplate: handleAddTemplate,
              })
            }
          >
            <Text style={styles.addBtnText}>+ Add new template</Text>
          </TouchableOpacity>

          {programs.map((p) => (
            <View key={p.id} style={styles.programCard}>
              <TouchableOpacity
                style={styles.cardTop}
                onPress={() =>
                  navigation.navigate("Program", {
                    programId: p.id,
                    title: p.title,
                    subtitle: p.subtitle,
                  })
                }
              >
                <View style={styles.programThumb}>
                  <Text style={styles.programThumbText}>{p.targetMuscle}</Text>
                </View>

                <View style={styles.programInfo}>
                  <Text style={styles.programTitle}>{p.title}</Text>
                  <Text style={styles.programSub}>{p.subtitle} exercise</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => handleRemove(p.id)}
              >
                <Text style={styles.removeBtnText}>Remove template</Text>
              </TouchableOpacity>
            </View>
          ))}

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f6f7fb" },
  screen: { flex: 1 },

  header: {
    paddingTop: 14,
    paddingBottom: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    backgroundColor: "#fff",
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

  headerRight: { width: 44 },

  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },

  pageTitle: {
    fontSize: 30,
    fontWeight: "900",
    marginBottom: 16,
  },

  addBtn: {
    backgroundColor: "#0b1220",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 16,
  },

  addBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },

  programCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#d9dee7",
    padding: 16,
    marginBottom: 16,
  },

  cardTop: {
    flexDirection: "row",
  },

  programThumb: {
    width: 100,
    height: 100,
    borderRadius: 16,
    backgroundColor: "#f1f3f6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
    paddingHorizontal: 8,
  },

  programThumbText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#2583e8",
    textAlign: "center",
  },

  programInfo: {
    flex: 1,
    justifyContent: "center",
  },

  programTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#111827",
  },

  programSub: {
    marginTop: 8,
    color: "#6b7280",
    fontWeight: "800",
    fontSize: 18,
  },

  removeBtn: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: "#ef4444",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },

  removeBtnText: {
    color: "#ef4444",
    fontWeight: "800",
  },
});