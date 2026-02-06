import { AppRegistry } from 'react-native';
import App from './App';

// Register the app
AppRegistry.registerComponent('Knect', () => App);

// Run the app (web-only shim)
AppRegistry.runApplication('Knect', {
  rootTag: document.getElementById('root')
});