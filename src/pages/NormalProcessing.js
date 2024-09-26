import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import axios from 'axios';
import Scan from '../components/Scan';
import TakePhoto from '../components/TakePhoto';
import {SERVER_IP} from '../config/ip';
import Geolocation from '@react-native-community/geolocation';
import ImageResizer from 'react-native-image-resizer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
const RadioButton = ({label, value, currentValue, onChange}) => {
  const isSelected = value === currentValue;

  return (
    <TouchableOpacity
      style={styles.radioButton}
      onPress={() => onChange(value)}>
      <Text style={{fontSize: 16}}>{label}</Text>
      <View
        style={[
          styles.radioCircle,
          {borderColor: isSelected ? '#3498db' : '#000'},
        ]}>
        {isSelected && <View style={styles.innerCircle} />}
      </View>
    </TouchableOpacity>
  );
};

function NormalProcessing({route, navigation}) {
  const {ticketNo} = route.params;
  const [isLoading, setIsLoading] = useState(false);
  const [imgUrl, setImgUrl] = useState('');
  const [compNum, setCompNum] = useState('');
  const [weight, setWeight] = useState('');
  const [quality, setQuality] = useState('good quality');
  const [supplierId, setSupplierId] = useState('');
  const [supplierInfo, setSupplierInfo] = useState({
    location: '',
    supplierName: '',
  });

  const handleImage = async imageUri => {
    try {
      const resizedImage = await ImageResizer.createResizedImage(
        imageUri,
        1280,
        720,
        'JPEG',
        90,
        0,
      );
      setImgUrl(resizedImage.uri);
    } catch (error) {
      console.log('Image processing failed:', error);
    }
  };

  const handleQuality = selectedQuality => {
    setQuality(selectedQuality);
  };

  const handleQRScan = async scan => {
    try {
      setSupplierId(scan);
      const response = await axios.get(
        `${SERVER_IP}api/get_supplier.php?supplierId=${scan}`,
      );
      setSupplierInfo({
        location: response.data.Location || '',
        supplierName: response.data.SupplierName || '',
      });
    } catch (error) {
      setSupplierInfo({
        location: '',
        supplierName: '',
      });
    }
  };
  const isValidWeight = weight => {
    return weight > 0;
  };
  const isValidCompNum = compNum => {
    const regex = /^[1-9]+[1-9]*$/;
    return regex.test(compNum);
  };
  const preprocessCompNum = compNum => {
    return compNum.replace(/[^\d]/g, '');
  };
  const handleSubmit = async () => {
    const formattedCompNum = preprocessCompNum(compNum);

    if (!ticketNo) {
      Alert.alert('වැරැද්දක් සිදුවී ඇත');
      navigation.navigate('CreateTicket');
      return;
    }

    if (quality === 'good quality' && !isValidWeight(weight)) {
      Alert.alert('වැරැද්දක් සිදුවී ඇත', 'බර සදහා 0 හෝ - අගයක් බාවිතා නොකරන්න');
      return;
    }

    if (quality === 'good quality' && !isValidCompNum(formattedCompNum)) {
      Alert.alert('වැරැද්දක් සිදුවී ඇත', 'ටැංකි අංකය අන්‍යාවශ්‍ය වේ');
      return;
    }

    if (!supplierId) {
      Alert.alert('සිහි කැදවීම', 'QR එක Scan කරන්න');
      return;
    }

    if (quality === 'good quality' && !imgUrl) {
      Alert.alert('සිහි කැදවීම', 'පින්තූරයක් ලබා ගන්න');
      return;
    }
    setIsLoading(true);
    const formData = new FormData();
    if (imgUrl) {
      formData.append('image', {
        uri: imgUrl,
        type: 'image/jpeg',
        name: 'image.jpg',
      });
    }
    formData.append('ticketNo', ticketNo);
    formData.append('reason', quality);
    formData.append('supplierId', supplierId);
    formData.append('litersCount', parseFloat(weight) || 0);
    formData.append('compNo', parseFloat(formattedCompNum) || 0);

    // Check the network status
    NetInfo.fetch().then(async state => {
      if (state.isConnected && state.isInternetReachable) {
        // Network is available, try to send data via Axios
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

          setIsLoading(false);
          console.log(response.data);

          if (response.data === 'Data saved successfully') {
            addJourney(); // Call the addJourney function if successful
          } else {
            Alert.alert('දෝෂයක් සිදුවී ඇත!', response.data);
            console.log(response);
          }
        } catch (error) {
          console.log('Axios error, saving data locally', error);
          await saveDataLocally();
          navigation.navigate('SelectOptions', {ticketNo});
        }
      } else {
        Alert.alert(
          'අන්තර්ජාල සම්බන්ධතාවයක් නොමැත',
          'දත්ත ස්ථානිකව සුරකින ලදි.',
        );
        await saveDataLocally();
        navigation.navigate('SelectOptions', {ticketNo});
      }
    });

    const saveDataLocally = async () => {
      const uniqueKey = `@pending_submission_${Date.now()}`;
      await AsyncStorage.setItem(
        uniqueKey,
        JSON.stringify({
          ticketNo,
          reason: quality,
          supplierId,
          litersCount: parseFloat(weight) || 0,
          compNo: parseFloat(formattedCompNum) || 0,
          image: imgUrl
            ? {
                uri: imgUrl,
                type: 'image/jpeg',
                name: 'image.jpg',
              }
            : null,
          timestamp: Date.now(),
        }),
      );
      setIsLoading(false);
    };
  };

  // For get location
  const [location, setLocation] = useState({
    accuracy: null,
    latitude: null,
    longitude: null,
    speed: null,
    time: null,
  });

  useEffect(() => {
    const timeLoggerInterval = setInterval(() => {
      Geolocation.getCurrentPosition(
        info => {
          const newLocation = {
            accuracy: info.coords.accuracy,
            latitude: info.coords.latitude,
            longitude: info.coords.longitude,
            speed: info.coords.speed,
            time: new Date().toLocaleTimeString(),
          };
          setLocation(newLocation);
        },
        error => console.log(error),
      );
    }, 3000);

    return () => {
      clearInterval(timeLoggerInterval);
    };
  }, []);

  // Update Location
  addJourney = () => {
    const phpUrl = `${SERVER_IP}api/insert_journey.php`;
    fetch(phpUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `ticketNo=${ticketNo}&latitude=${location.latitude}&longitude=${location.longitude}`,
    })
      .then(response => {
        return response.text();
      })
      .then(data => {
        if (data === 'Data Saved') {
          navigation.navigate('SelectOptions', {ticketNo: ticketNo});
        } else {
          Alert.alert('දෝෂයක් සිදුවී ඇත! නැවත උත්සාහ කරන්න');
        }
      })
      .catch(error => {
        console.log('Error : ', error);
      });
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View style={styles.txtDiv}>
          <Text style={styles.txtDivContent}>{ticketNo}</Text>
        </View>
        <View style={styles.camImgCont}>
          <Image style={styles.camImg} source={require('../res/Camera.png')} />
          <TakePhoto handleImage={handleImage} />
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.meterContainer}>
          {imgUrl ? (
            <Image style={styles.meter} source={{uri: imgUrl}} />
          ) : (
            <Image style={styles.meter} source={require('../res/Meter.jpg')} />
          )}
        </View>
        <View style={styles.flexContainer}>
          <View style={styles.inputData}>
            <Text style={{fontSize: 16, padding: 10}}>Compartment</Text>
            <TextInput
              onChangeText={setCompNum}
              value={compNum}
              style={styles.inputLiters}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.inputData}>
            <Text style={{fontSize: 16, padding: 10}}>Weight</Text>
            <TextInput
              onChangeText={setWeight}
              value={weight}
              style={styles.inputLiters}
              keyboardType="numeric"
            />
          </View>
        </View>
        <View style={styles.reasonWrap}>
          <RadioButton
            label="ගුණාත්මක තත්වයේ පොල් වතුර"
            value="good quality"
            currentValue={quality}
            onChange={handleQuality}
          />
          <RadioButton
            label="ගුණාත්මක නොවන පොල් වතුර"
            value="bad quality"
            currentValue={quality}
            onChange={handleQuality}
          />
          <RadioButton
            label="පොල් වතුර අවසන් වී ඇත"
            value="out of stock"
            currentValue={quality}
            onChange={handleQuality}
          />
        </View>
        <View style={styles.btnSaveWrap}>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isLoading}
            style={styles.btnSave}>
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.btnSaveTxt}>පුරවන්න</Text>
            )}
          </TouchableOpacity>
        </View>
        {supplierInfo.location.trim() !== '' &&
          supplierInfo.supplierName.trim() !== '' && (
            <View style={styles.textcontainer}>
              <Text style={styles.text}>
                {supplierInfo.supplierName} - {supplierInfo.location}
              </Text>
            </View>
          )}
      </ScrollView>

      <View style={styles.bottomBar}>
        <View style={styles.txtDivBB}>
          <Text style={styles.txtDivContentBB}>Supplier: {supplierId}</Text>
        </View>
        <View style={styles.camImgContBB}>
          <Image
            style={styles.camImgBB}
            source={require('../res/QRScan.png')}
          />
          <Scan onScanData={handleQRScan} style={styles.camImgBB} />
        </View>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#75d173de',
  },
  topBar: {
    height: 130,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  txtDiv: {
    height: 80,
    width: 260,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#30984b',
  },
  txtDivContent: {
    color: 'white',
    fontFamily: 'Inter-Regular',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 0,
  },
  textcontainer: {
    padding: 10,
  },
  text: {
    fontSize: 20,
    textAlign: 'center',
    color: 'black',
  },
  reasonWrap: {
    left: 48,
    top: 10,
    marginBottom: 10,
  },

  camImgCont: {
    backgroundColor: '#30984b',
    borderBottomStartRadius: 50,
    width: 130,
    height: 130,
    position: 'relative',
  },
  camImg: {
    position: 'absolute',
    width: 70,
    top: 20,
    left: 30,
    height: 70,
  },

  bottomBar: {
    minHeight: 130,
    maxHeight: 150,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  txtDivBB: {
    height: 80,
    width: 260,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#30984b',
  },
  txtDivContentBB: {
    color: 'white',
    fontFamily: 'Inter-Regular',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 0,
  },
  camImgContBB: {
    backgroundColor: '#30984b',
    borderTopStartRadius: 50,
    width: 130,
    height: 130,
    position: 'relative',
  },
  camImgBB: {
    position: 'absolute',
    width: 70,
    top: 30,
    left: 30,
    height: 70,
  },

  content: {
    flex: 1,
  },

  meterContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 100,
  },
  meter: {
    height: 100,
    width: 100,
  },

  flexContainer: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  inputData: {
    width: '40%',
  },
  inputLiters: {
    borderColor: '#ccc',
    backgroundColor: '#f1f1f1',
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 6,
    fontSize: 20,
  },
  button: {
    padding: 10,
    backgroundColor: '#f1f1f1',
    borderRadius: 5,
  },
  buttonText: {
    fontSize: 16,
  },
  addRowButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    width: 200,
    borderRadius: 10,
    marginTop: 10,
    marginLeft: 20,
    alignItems: 'center',
  },
  addRowButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },
  modalContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  modalItemText: {
    fontSize: 16,
  },
  closeButton: {
    padding: 10,
    marginTop: 10,
    alignItems: 'center',
  },
  closeButtontext: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  agreeTxt: {
    height: 49,
    left: 48,
    top: 10,
    width: 229,
    backgroundColor: '#30984b',
    borderRadius: 20,
    marginBottom: 10,
  },
  btnSaveWrap: {
    height: 49,
    left: 48,
    top: 10,
    width: 229,
    backgroundColor: '#30984b',
    borderRadius: 20,
    marginBottom: 10,
  },
  btnSaveTxt: {
    color: '#000000',
    fontSize: 25,
    fontWeight: '700',
    left: 50,
    top: 10,
  },

  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  innerCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3498db',
  },
});

export default NormalProcessing;