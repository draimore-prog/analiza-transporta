// Registracija pozadinskog TaskManager taska prije montiranja komponente
import "./backgroundWatcher.js";
import { registerRootComponent } from "expo";
import App from "./App.js";

registerRootComponent(App);
