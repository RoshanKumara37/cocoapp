import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Alert } from 'react-native';
import axios from 'axios';
import NetInfo from '@react-native-community/netinfo';
import { SERVER_IP } from '../config/ip';

const ViewFilling = ({ route }) => {
  const { ticketNo } = route.params;
  const [fillings, setFillings] = useState([]);
  const [isConnected, setIsConnected] = useState(true);
  const getFillings = async () => {
    try {
      const response = await axios.get(
        `${SERVER_IP}api/get_fillings.php?ticketNo=${ticketNo}`
      );
      const sortedData = response.data.sort((a, b) => {
        const dateA = new Date(a.Time.date);
        const dateB = new Date(b.Time.date);
        return dateB - dateA;
      });
      setFillings(sortedData);
    } catch (error) {
      console.log('Error fetching fillings data', error);
    }
  };

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected && state.isInternetReachable);
    });
    if (isConnected) {
      getFillings();
    } 
    return () => {
      unsubscribe();
    };
  }, [isConnected]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const renderFillingItem = ({ item }) => (
    <View style={styles.fillingContainer}>
      <Text style={styles.fillingText}>මිල් නම : {item.SupplierName}</Text>
      <Text style={styles.fillingText}>බර : {item.LitersCount}</Text>
      <Text style={styles.fillingText}>තත්වය : {item.reason}</Text>
      <Text style={styles.fillingText}>පුරවන ලද වේලාව : {formatDate(item.Time.date)}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>පොල් වතුර එකතු කිරීම්</Text>
      {isConnected ? (
        <FlatList
          data={fillings}
          renderItem={renderFillingItem}
          keyExtractor={(item, index) => index.toString()}
        />
      ) : (
        <Text style={styles.errorText}>අන්තර්ජාල සම්බන්ධතාවයක් නොමැත</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#299E52',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  heading: {
    padding: 5,
    fontSize: 25,
    marginBottom: 5,
    fontWeight: 'bold',
    color: 'white',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  fillingContainer: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
    width: '100%',
  },
  fillingText: {
    fontSize: 18,
  },
  errorText: {
    fontSize: 24,
    color: 'white',
    fontWeight:'700',
    marginTop: 20,
    textAlign: 'center',
  },
});

export default ViewFilling;
