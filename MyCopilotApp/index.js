import "react-native-get-random-values"; // secure RNG — must be first
import "@copilotkit/react-native/polyfills";

import { AppRegistry } from "react-native";
import App from "./App"; // eslint-disable-line no-unused-vars -- doc line, kept verbatim
import Harness from "./Harness"; // HARNESS: page switcher; the quickstart page is still ./App
import { name as appName } from "./app.json";

// HARNESS: registers the page switcher instead of App (App is its default page)
AppRegistry.registerComponent(appName, () => Harness);
