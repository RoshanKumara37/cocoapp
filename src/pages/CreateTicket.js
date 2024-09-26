import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  Alert,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import {SERVER_IP} from '../config/ip';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CreateTicket = ({navigation}) => {
  const [vehicleNo, setVehicleNo] = useState('');
  const [driver, setDriver] = useState('');

  const [loading, setLoading] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [waitingTime, setWaitingTime] = useState(0);
  const [timerInterval, setTimerInterval] = useState(null);

  const startTransaction = async () => {
    if (!vehicleNo) {
      Alert.alert('වාහන අංකය අනිවාර්ය වේ');
      return;
    }
    if (!driver) {
      Alert.alert('රියදුරුගේ නම අනිවාර්ය වේ');
      return;
    }
    const formattedVehicleNo = formatVehicleNo(vehicleNo);
    if (!formattedVehicleNo) {
      Alert.alert('වාහන අංකය වැරදි', 'නිවැරදි ආකාරය (AA-6789)');
      return;
    }
    setLoading(true);
    setResponseText('');
    setWaitingTime(0);

    const intervalId = setInterval(() => {
      setWaitingTime(prev => prev + 1);
    }, 1000);
    setTimerInterval(intervalId);

    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      setResponseText(
        'No Internet Connection. Please check your mobile data or Wi-Fi connection.',
      );
      Alert.alert('නෙට්වර්ක් දෝෂය', 'දුරකථනයේ ඩේටා ඔන් කරන්න');
      clearInterval(intervalId);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      setResponseText(
        'Request Timeout. Please check your data connection or try again later.',
      );
      clearInterval(intervalId);
      setLoading(false);
    }, 10000);

    try {
      const formData = new URLSearchParams({
        vehicleNo: formattedVehicleNo,
        driver: driver,
      });

      const response = await fetch(`${SERVER_IP}api/start_transaction.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
        signal: controller.signal,
      });

      const responseText = await response.text();
      console.log('Raw Response:', responseText);
      const isJSON = response.headers
        .get('content-type')
        ?.includes('application/json');
      if (!isJSON) {
        throw new Error(
          'Expected JSON response, but received HTML or other content.',
        );
      }
      const data = JSON.parse(responseText);
      if (!response.ok || data.error) {
        throw new Error(data.message || 'Something went wrong');
      }
      setResponseText(`Ticket No: ${data.TicketNo}, Date: ${data.Date}`);
      storeValue(formattedVehicleNo, driver, data.TicketNo, data.Date);
    } catch (error) {
      if (error.name === 'AbortError') {
        setResponseText('Request was aborted due to timeout.');
        Alert.alert(
          'නෙට්වර්ක් දෝෂය',
          'ආවරණ කලාපයෙන් බැහැරව ඇත හෝ ඩේටා අවසන් වී ඇත',
        );
      } else if (error.message === 'Network request failed') {
        setResponseText(
          'Server Unreachable. Please check if the server is reachable or try again later.',
        );
      } else if (
        error.message ===
        'Expected JSON response, but received HTML or other content'
      ) {
        setResponseText(
          'Server Error: Received HTML response instead of JSON. Check server logs',
        );
      } else {
        setResponseText('Something went wrong. Please try again later.');
      }
    } finally {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
      setLoading(false);
    }
  };

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [timerInterval]);

  // Calculate percentage for button fill
  const percentage = (waitingTime / 10) * 100;

  const getValue = async () => {
    try {
      const vNumber = await AsyncStorage.getItem('v-No');
      const dName = await AsyncStorage.getItem('d-Name');
      if (vNumber !== null) {
        setVehicleNo(vNumber);
      }
      if (dName !== null) {
        setDriver(dName);
      }
    } catch (e) {
      console.log('Error retrieving the vehicle number or driver name', e);
    }
  };

  useEffect(() => {
    getValue();
  }, []);

  const storeValue = async (vehicleNumber, driverName, ticketNo, date) => {
    try {
      await AsyncStorage.setItem('v-No', vehicleNumber);
      await AsyncStorage.setItem('d-Name', driverName);
      await AsyncStorage.setItem('t-No', ticketNo);
      await AsyncStorage.setItem('date', date);
      navigation.navigate('SelectOptions');
    } catch (e) {
      console.log('Error storing the vehicle number or driver name', e);
    }
  };

  const formatVehicleNo = vNo => {
    let formattedVNo = vNo.replace(/[\s-]/g, '');
    if (formattedVNo.length === 6) {
      const letters = formattedVNo.slice(0, 2).toUpperCase();
      const numbers = formattedVNo.slice(2);
      if (/^[A-Z]{2}$/.test(letters) && /^[0-9]{4}$/.test(numbers)) {
        return `${letters}-${numbers}`;
      }
    }
    return null;
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('../res/Logo.png')}
        style={[styles.logo, {resizeMode: 'contain'}]}
      />
      <Text style={styles.heading}>පොල් වතුර එකතු කිරීම</Text>
      <View style={styles.inputContainer}>
        <Text style={styles.inputTxt}>වාහන අංකය ඇතුලත් කරන්න : </Text>
        <TextInput
          onChangeText={setVehicleNo}
          value={vehicleNo}
          style={styles.inputData}
          required
        />
      </View>
      <View style={styles.inputContainer}>
        <Text style={styles.inputTxt}>රියදුරුගේ නම : </Text>
        <TextInput
          onChangeText={setDriver}
          value={driver}
          style={styles.inputData}
          required
        />
      </View>
      <TouchableOpacity
        onPress={() => startTransaction('AA-1234', 'John Doe')}
        disabled={loading}
        style={[styles.btn, {backgroundColor: loading ? 'yellow' : 'blue'}]}>
        <View
          style={{
            height: '100%',
            width: `${loading ? percentage : 0}%`,
            backgroundColor: 'blue',
            position: 'absolute',
            left: 0,
            top: 0,
          }}
        />
        <Text style={styles.btnText}>
          {loading ? 'දත්ත ලබා ගනිමින්' : 'ඉදිරියට යන්න'}
        </Text>
      </TouchableOpacity>

      {loading && (
        <>
          <Text style={styles.waitingTimeText}>
            Waiting Time: {waitingTime} seconds
          </Text>
        </>
      )}
      {responseText ? (
        <Text style={styles.responseText}>{responseText}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#299E52',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  heading: {
    padding: 5,
    fontSize: 25,
    fontWeight: 'bold',
    textAlign: 'center',
    color: 'black',
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 10,
  },
  inputTxt: {
    fontSize: 20,
    marginBottom: 5,
    color: 'black',
  },
  inputData: {
    fontSize: 20,
    borderWidth: 1,
    color: 'black',
    borderColor: 'gray',
    backgroundColor: 'white',
    padding: 10,
    width: '100%',
    borderRadius: 5,
  },
  btn: {
    borderRadius: 10,
    height: 50,
    width: '100%',
    marginBottom: 20,
    width: '100%',
    borderColor: '#4c669f',
    borderWidth: 1,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  btnText: {
    fontSize: 20,
    color: 'white',
    textAlign: 'center',
    zIndex: 1,
  },
  btnDisabled: {
    backgroundColor: 'gray',
  },
  waitingTimeText: {
    marginTop: 10,
  },
  responseText: {
    marginTop: 20,
  },
});

export default CreateTicket;
