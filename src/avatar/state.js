export let isTalking = false;

export function setTalking(value) {
  isTalking = value;
}

export let mood = 'serious';

export function setMood(value) {
  mood = value;
}

export function getMood() {
  return mood;
}

export let isConversationActive = false;

export function setConversationActive(value) {
  isConversationActive = value;
}

export function getConversationActive() {
  return isConversationActive;
}

export let currentAudio = null;
export function setCurrentAudio(audio) {
  currentAudio = audio;
}

export let currentMixer = null;
export function setCurrentMixer(mixer) {
  currentMixer = mixer;
}

export let micStream = null;
export function setMicStream(stream) {
  micStream = stream;
}

export let renderLoopId = null;
export function setRenderLoopId(id) {
  renderLoopId = id;
}
export function getRenderLoopId() {
  return renderLoopId;
}

export let finishTimerId = null;
export function setFinishTimerId(id) {
  finishTimerId = id;
}
export function getFinishTimerId() {
  return finishTimerId;
}

export let currentScene = null;
export function setScene(scene) {
  currentScene = scene;
}
export function getScene() {
  return currentScene;
}

export let currentRenderer = null;
export function setRenderer(renderer) {
  currentRenderer = renderer;
}
export function getRenderer() {
  return currentRenderer;
}

export let currentAudioContext = null;
export function setAudioContext(ctx) {
  currentAudioContext = ctx;
}
export function getAudioContext() {
  return currentAudioContext;
}