import * as React from "react";
import { View, Text, Button } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import * as ImagePicker from "expo-image-picker";
import { VideoConverter } from "./video-converter";


const HomeScreen = ({ navigation, route }) => {
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false,
      quality: 1,
      base64: true,
    });

    console.log(result);

    if (!result.canceled) {
      const converter = new VideoConverter();
      const convertedUrl = await converter.uploadAndConvertVideo(result.assets[0]);

      console.log(convertedUrl);
    }
  };

  React.useEffect(() => {
    if (route.params?.name) {
      alert(route.params.name);
    }
  }, [route.params?.name]);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>Home Screen</Text>
      <Button title="Pick video" onPress={pickImage} />
    </View>
  );
};

const Stack = createNativeStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: "My home" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
