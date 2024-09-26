import React from 'react';
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import {launchCamera} from 'react-native-image-picker';

function TakePhoto({handleImage}) {
  const openCameraLib = async () => {
    const result = await launchCamera();
    if (result?.assets[0]?.uri) {
      handleImage(result.assets[0].uri);
    }
  };

  return (
    <View>
      <TouchableOpacity
        style={styles.btn}
        onPress={openCameraLib}></TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    position: 'absolute',
    top: 10,
    left: 20,
    padding: 50,
  },
});

export default TakePhoto;
