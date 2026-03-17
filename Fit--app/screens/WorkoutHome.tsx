import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList, ExerciseItem } from "../App";
import {
  workoutApi,
  type WorkoutTemplate,
  type WorkoutHistoryItem,
} from "../services/api";

type Nav = NativeStackNavigationProp<RootStackParamList, "WorkoutHome">;
type Route = RouteProp<RootStackParamList, "WorkoutHome">;

const parseApiDate = (value: string) => {
  // Older records can arrive without timezone suffix; treat them as UTC.
  const hasTimeZone = /([zZ]|[+-]\d{2}:\d{2})$/.test(value);
  return new Date(hasTimeZone ? value : `${value}Z`);
};

export default function WorkoutHome() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();

  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [history, setHistory] = useState<WorkoutHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [screenMessage, setScreenMessage] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const [templateRows, historyRows] = await Promise.all([
          workoutApi.getTemplates(),
          workoutApi.getHistory(),
        ]);
        if (!active) return;
        setTemplates(templateRows);
        setHistory(historyRows);
        setScreenMessage("");
      } catch (error) {
        if (!active) return;
        setScreenMessage(error instanceof Error ? error.message : "Failed to load workouts.");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [route.params?.refreshAt]);

  const [openTemplate, setOpenTemplate] = useState<WorkoutTemplate | null>(null);
  const [openHistory, setOpenHistory] = useState<WorkoutHistoryItem | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const removeTemplate = async (templateId: string) => {
    try {
      await workoutApi.deleteTemplate(templateId);
      setTemplates((prev) => prev.filter((t) => t.id !== templateId));
      if (openTemplate?.id === templateId) {
        setOpenTemplate(null);
      }
    } catch (error) {
      setScreenMessage(error instanceof Error ? error.message : "Failed to remove routine.");
    }
  };

  const templateNames = useMemo(() => templates.map((t) => t.name), [templates]);

  const startTemplateWorkout = (template: WorkoutTemplate) => {
    const selectedExercises: ExerciseItem[] = template.exercises.map((ex) => ({
      id: ex.id,
      name: ex.name,
      muscle: ex.muscle,
    }));
    setOpenTemplate(null);
    navigation.navigate("LogWorkout", {
      selectedExercises,
      startFresh: true,
      mode: "log_workout",
      templateName: template.name,
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.sectionTitle}>Workout</Text>

          <View style={styles.twoColRow}>
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.cardSmall}
              onPress={() => navigation.navigate("LogWorkout", { startFresh: true, mode: "create_routine" })}
            >
              <Text style={styles.cardText}>Create{"\n"}new routine</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.cardSmall}
              onPress={() => navigation.navigate("ExploreRoutines")}
            >
              <Text style={styles.cardText}>Explore{"\n"}routines</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.twoColRow}>
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.cardSmall}
              onPress={() => navigation.navigate("ChatRoutine")}
            >
              <Text style={styles.cardText}>Create routine{"\n"}using ChatGPT</Text>
            </TouchableOpacity>

            <View style={styles.cardSmallGhost} />
          </View>

          <View style={styles.sectionDivider} />

          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Created routines</Text>

            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => setEditOpen(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.listBox}>
            {!templates.length ? (
              <View style={styles.emptyRow}>
                <Text style={styles.emptyText}>No routines yet. Save a logged workout to create one.</Text>
              </View>
            ) : null}

            {templates.map((template: WorkoutTemplate, idx: number) => (
              <View key={`${template.id}-${idx}`}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.listRow}
                  onPress={() => setOpenTemplate(template)}
                >
                  <Text style={styles.listRowText}>{template.name}</Text>
                  <Text style={styles.smallCount}>
                    {template.exercises.length ? `${template.exercises.length} ex` : ""}
                  </Text>
                </TouchableOpacity>

                {idx !== templates.length - 1 && <View style={styles.rowDivider} />}
              </View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Workout history</Text>
          <View style={styles.listBox}>
            {!history.length ? (
              <View style={styles.emptyRow}>
                <Text style={styles.emptyText}>This section shows current and previous week logs.</Text>
              </View>
            ) : null}

            {history.map((item, idx) => (
              <View key={item.id}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.listRow}
                  onPress={() => setOpenHistory(item)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.listRowText}>{item.template_name}</Text>
                    <Text style={styles.historySubText}>
                      {parseApiDate(item.logged_at).toLocaleDateString()} | {item.total_sets} sets | {item.total_volume} kg
                    </Text>
                  </View>
                </TouchableOpacity>

                {idx !== history.length - 1 && <View style={styles.rowDivider} />}
              </View>
            ))}
          </View>

          {!!screenMessage && <Text style={styles.screenWarningText}>{screenMessage}</Text>}
          {loading ? <Text style={styles.loadingText}>Loading workouts...</Text> : null}

          <View style={{ height: 90 }} />
        </ScrollView>

        <View style={styles.bottomTabs}>
          <TouchableOpacity activeOpacity={0.8} style={styles.tab}>
            <Text style={styles.tabIcon}>🏋️</Text>
            <Text style={styles.tabTextActive}>Workout</Text>
          </TouchableOpacity>

          <View style={styles.tabDivider} />

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.tab}
            onPress={() => navigation.navigate("Profile")}
          >
            <Text style={styles.tabIcon}>👤</Text>
            <Text style={styles.tabText}>Profile</Text>
          </TouchableOpacity>
        </View>

        <Modal transparent visible={!!openTemplate} animationType="fade">
          <Pressable style={styles.modalOverlay} onPress={() => setOpenTemplate(null)}>
            <Pressable style={styles.folderModalCard} onPress={() => {}}>
              <View style={styles.folderModalTop}>
                <Text style={styles.folderModalTitle}>{openTemplate?.name}</Text>
                <TouchableOpacity onPress={() => setOpenTemplate(null)}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>

              {openTemplate?.exercises?.length ? (
                openTemplate.exercises.map((ex) => (
                  <Text key={ex.id} style={styles.exerciseLine}>
                    • {ex.name} ({ex.muscle})
                  </Text>
                ))
              ) : (
                <Text style={{ color: "#6b7280", fontWeight: "700" }}>
                  Empty template.
                </Text>
              )}

              <TouchableOpacity style={styles.startTemplateBtn} onPress={() => openTemplate && startTemplateWorkout(openTemplate)}>
                <Text style={styles.startTemplateText}>Start this routine</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>

        <Modal transparent visible={!!openHistory} animationType="fade">
          <Pressable style={styles.modalOverlay} onPress={() => setOpenHistory(null)}>
            <Pressable style={styles.folderModalCard} onPress={() => {}}>
              <View style={styles.folderModalTop}>
                <Text style={styles.folderModalTitle}>{openHistory?.template_name}</Text>
                <TouchableOpacity onPress={() => setOpenHistory(null)}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>

              {!!openHistory && (
                <View style={styles.workoutCard}>
                  <Text style={styles.workoutTitle}>Workout Summary</Text>
                  <Text style={styles.setLine}>
                    {parseApiDate(openHistory.logged_at).toLocaleString()} | {openHistory.total_sets} sets | {openHistory.total_volume} kg
                  </Text>

                  {openHistory.exercises.map((ex) => (
                    <View key={ex.id} style={{ marginTop: 8 }}>
                      <Text style={styles.exerciseLine}>• {ex.name}</Text>
                      {ex.sets.map((s, idx) => (
                        <Text key={`${ex.id}-${idx}`} style={styles.setLine}>
                          Set {idx + 1}: {s.kg} kg × {s.reps}
                        </Text>
                      ))}
                    </View>
                  ))}
                </View>
              )}
            </Pressable>
          </Pressable>
        </Modal>

        <Modal transparent visible={editOpen} animationType="fade">
          <Pressable style={styles.modalOverlay} onPress={() => setEditOpen(false)}>
            <Pressable style={styles.modalCard} onPress={() => {}}>
              <View style={styles.folderModalTop}>
                <Text style={styles.folderModalTitle}>Edit folders</Text>
                <TouchableOpacity onPress={() => setEditOpen(false)}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>

              {templateNames.map((name: string) => (
                <View key={name} style={styles.editRow}>
                  <Text style={styles.editRowText}>{name}</Text>
                  <TouchableOpacity
                    onPress={() => {
                      const template = templates.find((t) => t.name === name);
                      if (!template) return;
                      removeTemplate(template.id);
                    }}
                  >
                    <Text style={styles.removeText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </Pressable>
          </Pressable>
        </Modal>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f6f7fb",
    paddingTop: 12,
  },

  screen: { flex: 1 },

  content: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },

  sectionTitle: {
    marginTop: 18,
    marginBottom: 10,
    fontSize: 22,
    fontWeight: "800",
    color: "#0b1220",
  },

  twoColRow: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 14,
  },

  cardSmall: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#e6ebf2",
  },

  cardSmallGhost: {
    flex: 1,
    backgroundColor: "transparent",
  },

  cardText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0b1220",
    lineHeight: 24,
  },

  sectionDivider: {
    height: 1,
    backgroundColor: "#dfe6f1",
    marginTop: 8,
    marginBottom: 12,
  },

  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  editBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "#0b1220",
  },
  editText: { color: "#fff", fontSize: 16, fontWeight: "900" },

  listBox: {
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e6ebf2",
    overflow: "hidden",
  },

  listRow: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  listRowText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0b1220",
  },
  smallCount: { color: "#9aa6b2", fontWeight: "900" },

  rowDivider: {
    height: 1,
    backgroundColor: "#e6ebf2",
    marginLeft: 16,
  },
  emptyRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  emptyText: {
    color: "#6b7280",
    fontWeight: "700",
  },
  historySubText: {
    marginTop: 4,
    color: "#6b7280",
    fontWeight: "700",
  },
  screenWarningText: {
    marginTop: 10,
    color: "#b45309",
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#fde68a",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontWeight: "700",
  },
  loadingText: {
    marginTop: 10,
    color: "#6b7280",
    fontWeight: "700",
  },

  bottomTabs: {
    height: 64,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e6ebf2",
    flexDirection: "row",
    alignItems: "center",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  tabIcon: { fontSize: 18 },
  tabTextActive: { fontWeight: "900", color: "#0b1220" },
  tabText: { fontWeight: "700", color: "#6b7280" },

  tabDivider: {
    width: 1,
    height: "70%",
    backgroundColor: "#dfe6f1",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    padding: 18,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
  },

  folderModalCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
  },
  folderModalTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  folderModalTitle: { fontSize: 18, fontWeight: "900", color: "#0b1220" },
  modalClose: { fontSize: 18, fontWeight: "900", color: "#111827" },

  workoutCard: {
    backgroundColor: "#f6f7fb",
    borderRadius: 14,
    padding: 14,
    marginTop: 10,
  },
  workoutTitle: { fontSize: 16, fontWeight: "900", color: "#0b1220" },
  exerciseLine: { marginTop: 6, fontWeight: "800", color: "#111827" },
  setLine: { marginTop: 2, color: "#6b7280", fontWeight: "700" },
  startTemplateBtn: {
    marginTop: 14,
    backgroundColor: "#1e88e5",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  startTemplateText: { color: "#fff", fontWeight: "800" },

  editRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "#eef2f7",
  },
  editRowText: { fontWeight: "900", color: "#0b1220" },
  removeText: { color: "#ef4444", fontWeight: "900" },
});