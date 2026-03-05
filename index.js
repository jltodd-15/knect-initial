/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import ErrorBoundary from './components/ErrorBoundary';

const Root = () => (
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);


AppRegistry.registerComponent(appName, () => App);
