import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  Image,
  TextInput,
  Alert,
  Linking,
} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import NetInfo from '@react-native-community/netinfo';
import ViewDataScreen from './components/ViewDataScreen';
import {SessionProvider} from './SessionContext'; // Import SessionProvider
import MemberRegistrationScreen from './components/MemberRegistrationScreen';
import EstateRegistrationScreen from './components/EstateRegistrationScreen';
import QRCodeRegistrationScreen from './components/QRCodeRegistrationScreen';
import ProjectRegistrationScreen from './components/ProjectRegistrationScreen';
import ProjectRegistrationScreen1 from './components/ProjectRegistrationScreen1';
import ProjectCriteriaScreen from './components/ProjectCriteriaScreen';
import OfficerRegistrationScreen from './components/OfficerRegistrationScreen';
import RecordsScreen from './components/RecordsScreen';
import NewProjectAdd from './components/NewProjectAdd';
import CocoHarvestScreen from './components/CocoHarvestScreen';
import EstimateRecordKeepingScreen1 from './components/EstimateRecordKeepingScreen1';
import EstimateCocoScreen from './components/EstimateCocoScreen';
import {version as appVersion} from './package.json';
const Stack = createStackNavigator();

function LoginScreen({navigation}) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState(''); // const handleLogin = async () => { //   if (!username || !password) { //     Alert.alert('Login Failed', 'Please enter both username and password.'); //     return; //   } //   try { //     const response = await fetch( //       'http://116.12.80.10:8080/CocoQR/login.php', //       { //         method: 'POST', //         headers: { //           'Content-Type': 'application/x-www-form-urlencoded', //         }, //         body: `username=${username}&password=${password}`, //       }, //     ); //     const result = await response.json(); //     console.log('Response received:', result); //     if (result.success) { //       navigation.navigate('ViewData', {username: username}); // Pass username to the next screen //     } else { //       Alert.alert('Login Failed', result.message); //     } //   } catch (error) { //     console.error('Error during login:', error); //     Alert.alert('Login Failed', 'An error occurred. Please try again.'); //   } // };

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Login Failed', 'Please enter both username and password.');
      return;
    }

    try {
      // Step 1: Fetch status from QR_APPInstall_Status_Tab
      const statusResponse = await fetch(
        'http://116.12.80.10:8080/CocoQR/checkStatus.php',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          }, // No body parameter, so nothing is passed in the request body
        },
      );

      const statusResult = await statusResponse.json();
      console.log('Full status result:', statusResult); // Ensure 'version' matches the server response

      const serverAppVersion = statusResult.version;

      console.log(`Current app version: ${appVersion}`);
      console.log(`Available app version: ${serverAppVersion}`);

      if (statusResult.status == 1 && serverAppVersion !== appVersion) {
        // Use loose equality to avoid type issues
        console.log('Status is 1, triggering app update');

        Alert.alert(
          'Status Check',
          `Status is 1, a new version is available.\nCurrent Version: ${appVersion}\nAvailable Version: ${serverAppVersion}\nAttempting to open update URL.`,
        );

        const updateFilePath =
          'http://116.12.80.10:8080/CocoQR/FilePath/app-release.apk';

        Linking.openURL(updateFilePath)
          .then(() => {
            console.log('URL successfully opened for update');
          })
          .catch(err => {
            console.error('Failed to open update URL:', err);
            Alert.alert(
              'Update Failed',
              'Failed to open update URL. Please try again.',
            );
          });

        return; // Stop further login if an update is needed
      } else {
        console.log('No update required. Proceeding with login.');
      } // Step 3: Proceed with login

      const loginResponse = await fetch(
        'http://116.12.80.10:8080/CocoQR/login.php',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: `username=${encodeURIComponent(
            username,
          )}&password=${encodeURIComponent(password)}`,
        },
      );

      const loginResult = await loginResponse.json();
      console.log('Login response:', loginResult);

      if (loginResult.success) {
        navigation.navigate('ViewData', {username: username}); // Pass username to the next screen
      } else {
        Alert.alert('Login Failed', loginResult.message);
      }
    } catch (error) {
      console.error('Error during login:', error);
      Alert.alert('Login Failed', 'An error occurred. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
           {' '}
      <View style={styles.header}>
               {' '}
        <Image
          source={require('./assets/SilvermillLogo.png')} // Make sure to have the logo image in your assets folder
          style={styles.logo}
        />
               {' '}
        <Text style={styles.headerText}>S.A Silva & Sons Lanka (PVT) Ltd</Text> 
           {' '}
      </View>
           {' '}
      <View style={styles.content}>
               {' '}
        <Image
          source={require('./assets/Coco1.png')} // Make sure to have the coconut tree image in your assets folder
          style={styles.image}
        />
               {' '}
        <Text style={styles.title}>Coconut Estate Management System</Text>     
          <Text style={styles.title}>Login</Text>       {' '}
        <TextInput
          style={styles.input}
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
        />
               {' '}
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
               {' '}
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
                    <Text style={styles.buttonText}>Login</Text>       {' '}
        </TouchableOpacity>
             {' '}
      </View>
           {' '}
      {/* <View style={styles.footer}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </View> */}
         {' '}
    </View>
  );
}

export default function App() {
  // <- Ensure this is at the top level
  return (
    <NavigationContainer>
           {' '}
      <Stack.Navigator>
               {' '}
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{
            title: '',
            headerTransparent: true,
          }}
        />
               {' '}
        <Stack.Screen
          name="ViewData"
          component={ViewDataScreen}
          options={{title: ''}}
        />
               {' '}
        <Stack.Screen
          name="MemberRegistration"
          component={MemberRegistrationScreen}
        />
               {' '}
        <Stack.Screen
          name="EstateRegistration"
          component={EstateRegistrationScreen}
        />
               {' '}
        <Stack.Screen
          name="QRCodeRegistration"
          component={QRCodeRegistrationScreen}
        />
               {' '}
        <Stack.Screen name="ProjectRegistration" component={NewProjectAdd} />   
           {' '}
        <Stack.Screen
          name="OfficerRegistration"
          component={OfficerRegistrationScreen}
        />
                <Stack.Screen name="Records" component={RecordsScreen} />       {' '}
        <Stack.Screen name="NewProject" component={ProjectRegistrationScreen} />
               {' '}
        <Stack.Screen name="EstimateCoco" component={EstimateCocoScreen} />     
         {' '}
        <Stack.Screen
          name="ERecordKeeping"
          component={EstimateRecordKeepingScreen1}
        />
               {' '}
        <Stack.Screen
          name="ProjectDetails"
          component={ProjectRegistrationScreen1}
        />
               {' '}
        <Stack.Screen
          name="ProjectCriteria"
          component={ProjectCriteriaScreen}
        />
               {' '}
        <Stack.Screen name="CocoHarvest" component={CocoHarvestScreen} />     {' '}
      </Stack.Navigator>
         {' '}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E', // Light blue background color for a fresh look
    justifyContent: 'center', // Center the content vertically
    alignItems: 'center', // Center the content horizontally
  },
  header: {
    backgroundColor: '#003366', // Steel blue color for header
    paddingVertical: 10, // Increase padding for a more spacious header
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%', // borderBottomLeftRadius: 0, // Rounded corners for a modern look // borderBottomRightRadius: 0,
  },
  logo: {
    width: 100, // Increase the logo size for better visibility
    height: 60,
  },
  headerText: {
    color: '#fff',
    fontSize: 20, // Slightly larger text size
    fontWeight: 'bold',
    marginTop: 10,
  },
  content: {
    flex: 1,
    width: '90%', // Take up most of the screen width
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -30, // Slightly overlap the header for a dynamic effect
  },
  userImage: {
    width: 120, // Larger profile image
    height: 120,
    borderRadius: 60, // Circular profile image
    marginBottom: 30, // More space between image and title
    borderColor: '#4682b4', // Matching border color with header
    borderWidth: 2,
  },
  title: {
    fontSize: 23, // Larger title for emphasis
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#4682b4', // Steel blue color to match the header
  },
  input: {
    width: '100%',
    height: 45, // Slightly taller input fields for easier typing
    borderColor: '#4682b4',
    borderWidth: 1,
    fontSize: 20,
    borderRadius: 10, // Rounded input fields
    marginBottom: 20,
    fontWeight: 'bold',
    paddingHorizontal: 15,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#003366',
    borderRadius: 30, // More rounded corners for buttons
    paddingVertical: 15,
    paddingHorizontal: 20,
    width: '100%', // Full width for buttons
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20, // Space between the last input and button
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    backgroundColor: '#003366',
    padding: 20,
    alignItems: 'center',
    width: '100%',
  },
  backButton: {
    marginTop: 10,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  footerText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
