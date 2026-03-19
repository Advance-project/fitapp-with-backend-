import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

const slides = [
  { title: "Welcome!", text: "to Fit\nfor better lifestyle\nand mental health" },
  { title: "Keep track", text: "Keep track of each\nworkout and activity." },
  {
    title: "Smart plans",
    text: "Use the routine assistant\nto build workout plans\nthat fit your schedule.",
  },
];

export default function Onboarding() {
  const [index, setIndex] = useState(0);
  const navigation = useNavigation<any>();
  const isLast = index === slides.length - 1;

  return (
    <View style={styles.screen}>
      <ImageBackground
        source={require("../assets/images/background4.jpg")}
        style={styles.bg}
        resizeMode="cover"
      >
        <View style={styles.overlay} />

        <View style={styles.container}>
          <Text style={styles.title}>{slides[index].title}</Text>
          <Text style={styles.text}>{slides[index].text}</Text>

          <View style={styles.dots}>
            {slides.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === index && styles.dotActive]}
              />
            ))}
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={() =>
              isLast ? navigation.replace("WorkoutHome") : setIndex(index + 1)
            }
          >
            <Text style={styles.buttonText}>
              {isLast ? "Get Started" : "Next"}
            </Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    minHeight: "100vh" as any,
  },

  bg: {
    flex: 1,
    width: "100%",
    height: "100%",
    minHeight: "100vh" as any,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.65)",
  },

  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },

  title: {
    fontSize: 34,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 12,
    color: "#000",
  },

  text: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    color: "#222",
  },

  dots: {
    flexDirection: "row",
    marginTop: 22,
    marginBottom: 18,
    gap: 10,
  },

  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: "#cfcfcf",
  },

  dotActive: {
    backgroundColor: "#111",
  },

  button: {
    backgroundColor: "#111",
    paddingVertical: 14,
    paddingHorizontal: 38,
    borderRadius: 16,
    marginTop: 6,
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
