import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Button, Alert, ActivityIndicator, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { SERVER_IP } from '../config/ip';
import NetInfo from '@react-native-community/netinfo';

const PendingFillings = ({ navigation }) => {
  const [pendingData, setPendingData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load pending submissions from AsyncStorage
  useEffect(() => {
    const loadPendingSubmissions = async () => {
      setIsLoading(true);
      try {
        const keys = await AsyncStorage.getAllKeys();
        const pendingKeys = keys.filter((key) => key.startsWith('@pending_submission_'));
        const pendingSubmissions = await AsyncStorage.multiGet(pendingKeys);
        const submissions = pendingSubmissions.map(([key, value]) => {
          try {
            return JSON.parse(value);
          } catch (e) {
            console.error(`Error parsing submission ${key}`, e);
            return null;
          }
        }).filter(submission => submission !== null);

        setPendingData(submissions);
      } catch (error) {
        setError('Error loading pending submissions');
        console.error('Error loading pending submissions', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadPendingSubmissions();
  }, []);

  // Retry sending a pending submission
  const retrySubmission = async (submission, index) => {
    setIsLoading(true);
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
    formData.append('litersCount', parseFloat(submission.litersCount) || 0);
    formData.append('compNo', parseFloat(submission.compNo) || 0);

    try {
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
        const submissionKey = `@pending_submission_${submission.timestamp}`;
        await AsyncStorage.removeItem(submissionKey);
        setPendingData(prevData => prevData.filter((_, i) => i !== index));
        Alert.alert('Success', 'Data saved successfully!');
      } else {
        Alert.alert('Error', response.data || 'An unknown error occurred.');
      }
    } catch (error) {
      console.error('Network error, could not retry submission', error);
      Alert.alert('Error', 'Data submission failed. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to check network connectivity and automatically retry submissions
  const checkNetworkAndRetry = async () => {
    try {
      const state = await NetInfo.fetch();
      if (state.isConnected) {
        if (pendingData.length > 0) {
          // Retry the first pending submission
          await retrySubmission(pendingData[0], 0);
        }
      }
    } catch (error) {
      console.error('Error checking network connectivity', error);
    }
  };

  // Poll for network connectivity and retry submissions every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      checkNetworkAndRetry();
    }, 30000); // 30 seconds

    return () => clearInterval(interval); // Cleanup on unmount
  }, [pendingData]);

  const renderItem = ({ item, index }) => (
    <View style={{ padding: 10, borderBottomWidth: 1, borderColor: '#ccc' }}>
      <Text>Ticket Number: {item.ticketNo}</Text>
      <Text>Reason: {item.reason}</Text>
      <Text>Supplier ID: {item.supplierId}</Text>
      <Text>Weight: {item.litersCount}</Text>
      <Text>Comp No: {item.compNo}</Text>
      {item.image && item.image.uri ? (
        <Image
          source={{ uri: item.image.uri }}
          style={{ width: 100, height: 100, marginTop: 10 }}
          resizeMode="cover"
        />
      ) : (
        <Text>No Image Available</Text>
      )}
      <Button
        title="Retry"
        onPress={() => retrySubmission(item, index)}
      />
    </View>
  );

  return (
    <View style={{ flex: 1, padding: 20 }}>
      {isLoading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : error ? (
        <Text style={{ color: 'red' }}>{error}</Text>
      ) : (
        <>
          <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>Pending Submissions</Text>
          {pendingData.length > 0 ? (
            <FlatList
              data={pendingData}
              keyExtractor={(item) => item.timestamp?.toString() || Math.random().toString()}
              renderItem={renderItem}
            />
          ) : (
            <Text>No pending submissions found.</Text>
          )}
        </>
      )}
    </View>
  );
};

export default PendingFillings;
