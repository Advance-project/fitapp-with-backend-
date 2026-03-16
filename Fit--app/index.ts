import { LogBox } from 'react-native';
import { registerRootComponent } from 'expo';

import App from './App';

// React Navigation internally uses pointerEvents as a View prop; suppress until upstream fixes it.
LogBox.ignoreLogs(['props.pointerEvents is deprecated']);

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
