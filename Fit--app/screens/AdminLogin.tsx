import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { setAdminAuthenticated } from "./userStore";

const ADMIN_ID = "a";
const ADMIN_PASSWORD = "a";

export default function AdminLogin() {
  const navigation = useNavigation<any>();
  const [adminId, setAdminId] = useState("");
  const [password, setPassword] = useState("");

  const handleAdminLogin = () => {
    const normalizedAdminId = adminId.trim().toLowerCase();
    const normalizedPassword = password.trim();
    const isValid =
      normalizedAdminId === ADMIN_ID &&
      normalizedPassword === ADMIN_PASSWORD;

    if (!isValid) {
      Alert.alert("Access denied", "Invalid admin ID or password.");
      return;
    }

    setAdminAuthenticated(true);
    navigation.replace("Admin");
  };

  return (
    <ImageBackground
      source={require("../assets/images/background5.jpg")}
      style={styles.bg}
      resizeMode="cover"
    >
      <View style={styles.top}>
        <Text style={styles.title}>Admin Login</Text>
      </View>

      <View style={styles.card}>
        <TextInput
          placeholder="Admin ID"
          style={styles.input}
          placeholderTextColor="#777"
          value={adminId}
          onChangeText={setAdminId}
          autoCapitalize="none"
          autoComplete="off"
          textContentType="none"
          importantForAutofill="no"
          autoCorrect={false}
        />

        <TextInput
          placeholder="Password"
          style={styles.input}
          secureTextEntry
          placeholderTextColor="#777"
          value={password}
          onChangeText={setPassword}
          autoCapitalize="none"
          autoComplete="off"
          textContentType="none"
          importantForAutofill="no"
          autoCorrect={false}
        />

        <TouchableOpacity style={styles.button} onPress={handleAdminLogin}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setAdminAuthenticated(false);
            navigation.navigate("Login");
          }}
        >
          <Text style={styles.link}>Back to User Login</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    width: "100%",
    height: "100%",
  },

  top: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 260,
  },

  title: {
    fontSize: 35,
    fontWeight: "bold",
    color: "#000",
  },

  card: {
    backgroundColor: "#0F1F2D",
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: 30,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },

  input: {
    backgroundColor: "#f8fafc",
    color: "#111827",
    borderWidth: 1,
    borderColor: "#d5dee9",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 14,
    fontSize: 16,
  },

  button: {
    backgroundColor: "#2196F3",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 6,
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },

  link: {
    marginTop: 14,
    textAlign: "center",
    color: "#0b63ce",
    textDecorationLine: "underline",
  },
});
