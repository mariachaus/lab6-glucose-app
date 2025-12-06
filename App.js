import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";
import RegisterScreen from "./RegisterScreen";
import LoginScreen from "./LoginScreen";
import SensorRecorder from "./SensorRecorder";
import SensorDataList from "./SensorDataList";
import { View, Button } from "react-native";

export default function App() {
  const [userId, setUserId] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUserId(user ? user.uid : null);
      if (user) setIsRegistering(false);
    });
    return unsub;
  }, []);

  return (
    <>
      {userId ? (
        <>
          {/* кнопка виходу */}
          <View style={{ padding: 10, marginTop: "10%", position: 'absolute', zIndex: 2 }}>
            <Button title="Вихід" onPress={() => signOut(auth)} />
          </View>

          <SensorRecorder userId={userId} />
          <SensorDataList userId={userId} />
        </>
      ) : isRegistering ? (
        <RegisterScreen 
          onRegistered={() => setIsRegistering(false)} 
          onGoLogin={() => setIsRegistering(false)}
        />
      ) : (
        <LoginScreen
          onLogin={(uid) => setUserId(uid)}
          onGoRegister={() => setIsRegistering(true)}
        />
      )}
    </>
  );
}
