import React, {useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import QRCodeScanner from 'react-native-qrcode-scanner';

const Scan = ({onScanData}) => {
  const [scanned, setScanned] = useState(false);

  const handleScanSuccess = ({data}) => {
    onScanData(data);
    setScanned(false);
  };

  const handleCancelScan = () => {
    setScanned(false);
  };

  return (
    <View>
      {scanned ? (
        <View style={styles.container}>
          <View style={styles.qrCodeContainer}>
            <QRCodeScanner
              onRead={handleScanSuccess}
              cameraStyle={{width: '100vw', height: 100}}
              bottomContent={
                <View>
                  <TouchableOpacity
                    onPress={handleCancelScan}
                    style={styles.cancelBtn}>
                    <Text style={{fontSize: 30, textAlign: 'center'}}>
                      Cancel Scan
                    </Text>
                  </TouchableOpacity>
                </View>
              }
            />
          </View>
        </View>
      ) : (
        <>
          <TouchableOpacity
            style={styles.scanBtn}
            onPress={() => setScanned(true)}></TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    top: -350,
    left: -300,
    zIndex: 99,
  },
  qrCodeContainer: {
    zIndex: 99,
    width: 400,
  },
  cancelBtn: {
    position: 'absolute',
    top: 200,
    left: -50,
    borderRadius: 30,
    // width: 250,
    backgroundColor: 'red',
    padding: 10,
  },
  scanBtn: {
    top: 30,
    borderRadius: 20,
    backgroundColor: 'transparent',
    padding: 30,
  },
});

export default Scan;
