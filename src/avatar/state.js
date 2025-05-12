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
