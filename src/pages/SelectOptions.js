import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useFocusEffect} from '@react-navigation/native';
import axios from 'axios';
import {SERVER_IP} from '../config/ip';
import NetInfo from '@react-native-community/netinfo';

const SelectOptions = ({navigation}) => {
  const [vehicleNo, setVehicleNo] = useState('');
  const [ticketNo, setTicketNo] = useState('');
  const [date, setDate] = useState('');
  const [isConnected, setIsConnected] = useState(true);
  const [loading, setLoading] = useState(true);

  // Function to fetch data from AsyncStorage and API
  const fetchData = useCallback(async () => {
    const storedTicketNo = await AsyncStorage.getItem('t-No');
    const storedVehicleNo = await AsyncStorage.getItem('v-No');
    const storedDate = await AsyncStorage.getItem('date');
    setTicketNo(storedTicketNo || '');
    setVehicleNo(storedVehicleNo || '');
    setDate(formatDate(storedDate) || '');
  }, []);

  const uploadPending = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const pendingKeys = keys.filter(key =>
        key.startsWith('@pending_submission_'),
      );
      const pendingSubmissions = await AsyncStorage.multiGet(pendingKeys);
      for (const [key, value] of pendingSubmissions) {
        try {
          const submission = JSON.parse(value);
          if (submission && isConnected) {
            const formData = new FormData();
            if (submission.image && submission.image.uri) {
              formData.append('image', {
                uri: submission.image.uri,
                type: 'image/jpeg',
                name: 'image.jpg',
              });
            }
            formData.append('ticketNo', submission.ticketNo);
            formData.append('reason', submission.reason);
            formData.append('supplierId', submission.supplierId);
            formData.append(
              'litersCount',
              parseFloat(submission.litersCount) || 0,
            );
            formData.append('compNo', parseFloat(submission.compNo) || 0);

            const response = await axios.post(
              `${SERVER_IP}api/insert_filling.php`,
              formData,
              {
                headers: {
                  'Content-Type': 'multipart/form-data',
                },
              },
            );
            if (response.data === 'Data saved successfully') {
              await AsyncStorage.removeItem(key);
            } else {
              console.log('Error uploading data:', response.data);
            }
          }
        } catch (error) {
          console.log('Error processing submission:', error);
        }
      }
    } catch (error) {
      console.log('Error fetching pending submissions:', error);
    }
  };
  useFocusEffect(() => {
    fetchData();
    setLoading(false);
    uploadPending();
  });

  const formatDate = dateString => {
    const date = new Date(dateString);
    const options = {hour: 'numeric', minute: 'numeric', hour12: true};
    const formattedTime = date.toLocaleString('en-US', options);
    const formattedDate = date.toISOString().split('T')[0];
    return `${formattedDate} | ${formattedTime}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading data, please wait...</Text>
        {!isConnected && (
          <Text style={styles.warningText}>No internet connection</Text>
        )}
      </View>
    );
  }

  const handleNavigation = async (targetScreen, netCheck) => {
    if (netCheck) {
      const state = await NetInfo.fetch();

      if (!state.isConnected || !state.isInternetReachable) {
        Alert.alert('දැනුම්දීමයි', 'දුරකථනයේ ඩේටා ඔන් කරන්න');
        return;
      } else {
        const phpUrl = `${SERVER_IP}api/check_ticket.php`;
        const data = `ticketNo=${ticketNo}`;
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error('Request timed out. Please try again.'));
          }, 10000);
        });
        try {
          const response = await Promise.race([
            axios.post(phpUrl, data, {
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
            }),
            timeoutPromise,
          ]);
          if (response.status === 200 && response.data) {
            if (response.data !== 'StartFilling') {
              navigation.navigate('CreateTicket');
            } else {
              navigation.navigate(targetScreen, {
                ticketNo: ticketNo,
              });
            }
          }
        } catch (error) {
          console.log('Error while making HTTP request:', error);
          Alert.alert(
            'වැරැද්දක් සිදුවී ඇත',
            error.message || 'An unexpected error occurred.',
          );
        }
      }
    } else {
      navigation.navigate(targetScreen, {
        ticketNo: ticketNo,
      });
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('../res/Logo.png')}
        style={[styles.logo, {resizeMode: 'contain'}]}
      />
      <Text style={styles.title}>ගමන් අංකය: {ticketNo}</Text>
      <Text style={styles.title}>වාහන අංකය: {vehicleNo}</Text>
      <Text style={styles.title}>දිනය: {date}</Text>
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => handleNavigation('NormalProcessing', false)}>
          <Image
            source={require('../res/defalt-filling.png')}
            style={[styles.buttonImage, {width: 120, height: 100}]}
          />
          <Text style={styles.buttonText}>සාමාන්‍ය ලෙස</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => handleNavigation('SignalIssues', true)}>
          <Image
            source={require('../res/no-weight.png')}
            style={[styles.buttonImage, {width: 120, height: 100}]}
          />
          <Text style={styles.buttonText}>බර කිරීමට නොහැකි විට</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => handleNavigation('PendingFillings', true)}>
          <Image
            source={require('../res/signal-issue.png')}
            style={[styles.buttonImage, {width: 120, height: 100}]}
          />
          <Text style={styles.buttonText}>සංඥා ගැටලු ඇති මිල්</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => handleNavigation('ViewFilling', true)}>
          <Image
            source={require('../res/view-filling.png')}
            style={[styles.buttonImage, {width: 120, height: 100}]}
          />
          <Text style={styles.buttonText}>පිරවීම් බලන්න</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.button, styles.homeButton]}
        onPress={() => navigation.navigate('CreateTicket')}>
        <Text style={styles.homeButtonText}>නව ගමනක් ඇරඹුම</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#75d173de',
    alignItems: 'center',
  },
  logo: {
    width: 130,
    height: 120,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 2,
    textAlign: 'center',
  },
  buttonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  button: {
    backgroundColor: '#4CAF50',
    borderColor: '#fff',
    borderWidth: 2,
    padding: 10,
    borderRadius: 20,
    marginVertical: 10,
    width: '45%',
    alignItems: 'center',
  },
  buttonImage: {
    marginBottom: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  homeButton: {
    backgroundColor: '#f44336',
    marginTop: 20,
    width: '100%',
  },
  homeButtonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  warningText: {
    color: 'red',
    marginTop: 10,
  },
});

export default SelectOptions;
