import React, { useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { syncIfConnected } from '@root/db/_defaultPersistence';

const InternetStatusMonitor = () => {
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        syncIfConnected();
      }
    });

    return () => unsubscribe();
  }, []);

  return null;
};

export default InternetStatusMonitor;
