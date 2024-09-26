import * as React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import CreateTicket from './src/pages/CreateTicket';
import ViewFilling from './src/pages/ViewFilling';
import SelectOptions from './src/pages/SelectOptions';
import NormalProcessing from './src/pages/NormalProcessing';
import SignalIssues from './src/pages/SignalIssues';
import PendingFillings from './src/pages/PendingFillings';
const Stack = createNativeStackNavigator();
function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="SelectOptions">
        <Stack.Screen
          name="CreateTicket"
          component={CreateTicket}
          options={{title: 'නව ගමනක්', headerShown: false}}
        />
        <Stack.Screen
          name="SelectOptions"
          component={SelectOptions}
          options={{title: 'අවස්ථාවක් තෝරන්න', headerShown: false}}
        />
        <Stack.Screen
          name="ViewFilling"
          component={ViewFilling}
          options={{title: 'පිරවුම් බැලීම'}}
        />
        <Stack.Screen
          name="NormalProcessing"
          component={NormalProcessing}
          options={{title: 'සාමාන්‍ය පරිදි'}}
        />
        <Stack.Screen
          name="SignalIssues"
          component={SignalIssues}
          options={{title: 'බර තරාදි ගැටලු'}}
        />
        <Stack.Screen
          name="PendingFillings"
          component={PendingFillings}
          options={{title: 'සිග්නල් ගැටලු'}}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
