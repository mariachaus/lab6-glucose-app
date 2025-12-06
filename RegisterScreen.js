import { useState } from "react";
import { View, TextInput, Button, Alert, StyleSheet, Text } from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";

const RegisterScreen = ({ onRegistered, onGoLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      Alert.alert("Успіх", "Користувач зареєстрований!");
      if (onRegistered) onRegistered();
    } catch (err) {
      Alert.alert("Помилка реєстрації", err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Реєстрація</Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        placeholder="Пароль"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />

      <Button title="Зареєструватися" onPress={handleRegister} color="#27ae60" />

      <Text style={styles.switchText} onPress={onGoLogin}>
        Вже є акаунт? Увійти
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
  },
  input: {
    borderWidth: 1,
    borderColor: "#aaa",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  switchText: {
    marginTop: 15,
    textAlign: "center",
    color: "#2980b9",
  },
});

export default RegisterScreen;
