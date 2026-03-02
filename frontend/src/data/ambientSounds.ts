export interface AmbientSoundDef {
  id: string;
  name: string;
  icon: string;
  url: string;
}

export const AMBIENT_SOUNDS: AmbientSoundDef[] = [
  {
    id: 'rain',
    name: 'Rain',
    icon: '🌧️',
    url: '/audio/ambient/rain.mp3',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    icon: '🌊',
    url: '/audio/ambient/ocean.mp3',
  },
  {
    id: 'forest',
    name: 'Forest',
    icon: '🌲',
    url: '/audio/ambient/forest.mp3',
  },
  {
    id: 'fire',
    name: 'Fire',
    icon: '🔥',
    url: '/audio/ambient/fire.mp3',
  },
  {
    id: 'wind',
    name: 'Wind',
    icon: '💨',
    url: '/audio/ambient/wind.mp3',
  },
  {
    id: 'birds',
    name: 'Birds',
    icon: '🐦',
    url: '/audio/ambient/birds.mp3',
  },
];
