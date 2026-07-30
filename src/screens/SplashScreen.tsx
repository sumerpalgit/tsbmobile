import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

function SplashScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>TSB</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0A84FF',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default SplashScreen;
