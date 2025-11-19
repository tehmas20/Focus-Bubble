import { SoundType } from '../types';

let audioCtx: AudioContext | null = null;
let activeNodes: AudioNode[] = []; // Track all nodes to disconnect
let stopTimeout: any = null;

const getAudioContext = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
};

// Pink Noise Generator (Paul Kellett's refined method)
const createPinkNoiseBuffer = (ctx: AudioContext): AudioBuffer => {
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;
    data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
    data[i] *= 0.11; // Compensate to roughly -1 to 1
    b6 = white * 0.115926;
  }
  return buffer;
};

const createWhiteNoiseBuffer = (ctx: AudioContext): AudioBuffer => {
  const bufferSize = ctx.sampleRate * 2; 
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
};

const createBrownNoiseBuffer = (ctx: AudioContext): AudioBuffer => {
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  let lastOut = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    data[i] = (lastOut + (0.02 * white)) / 1.02;
    lastOut = data[i];
    data[i] *= 3.5; 
  }
  return buffer;
};

export const playSound = async (type: SoundType) => {
  if (type === SoundType.NONE) {
    stopSound();
    return;
  }

  if (stopTimeout) {
    clearTimeout(stopTimeout);
    stopTimeout = null;
  }

  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }

  // Stop existing sound immediately (hard cut, but we are starting new)
  stopSound(true); 

  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0, ctx.currentTime);
  masterGain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 2); // Fade in
  masterGain.connect(ctx.destination);
  activeNodes.push(masterGain);

  if (type === SoundType.WHITE_NOISE) {
    const source = ctx.createBufferSource();
    source.buffer = createWhiteNoiseBuffer(ctx);
    source.loop = true;
    source.connect(masterGain);
    source.start();
    activeNodes.push(source);
  } 
  else if (type === SoundType.BROWN_NOISE) {
    const source = ctx.createBufferSource();
    source.buffer = createBrownNoiseBuffer(ctx);
    source.loop = true;
    source.connect(masterGain);
    source.start();
    activeNodes.push(source);
  }
  else if (type === SoundType.OCEAN) {
    // Ocean: Brown noise + Lowpass + LFO modulation
    const source = ctx.createBufferSource();
    source.buffer = createBrownNoiseBuffer(ctx);
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 600; 

    const waveGain = ctx.createGain();
    waveGain.gain.value = 0.5; // Base volume

    // LFO for waves
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.12; // 0.12Hz = ~8 second wave cycle

    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.3; // Modulate amplitude by +/- 0.3

    // Graph: LFO -> LFO_Gain -> Wave_Gain.gain
    lfo.connect(lfoGain);
    lfoGain.connect(waveGain.gain);

    // Audio Path
    source.connect(filter);
    filter.connect(waveGain);
    waveGain.connect(masterGain);

    source.start();
    lfo.start();

    activeNodes.push(source, filter, waveGain, lfo, lfoGain);
  }
  else if (type === SoundType.FOREST) {
    // Forest: Pink Noise + Highpass + Lowpass (Leaves rustle)
    const source = ctx.createBufferSource();
    source.buffer = createPinkNoiseBuffer(ctx);
    source.loop = true;

    const highPass = ctx.createBiquadFilter();
    highPass.type = 'highpass';
    highPass.frequency.value = 600; 

    const lowPass = ctx.createBiquadFilter();
    lowPass.type = 'lowpass';
    lowPass.frequency.value = 3000; 

    // Gentle breeze modulation (slower and subtler than ocean)
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.05; 

    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.15;

    const breezeGain = ctx.createGain();
    breezeGain.gain.value = 0.6; 

    lfo.connect(lfoGain);
    lfoGain.connect(breezeGain.gain);

    source.connect(highPass);
    highPass.connect(lowPass);
    lowPass.connect(breezeGain);
    breezeGain.connect(masterGain);

    source.start();
    lfo.start();

    activeNodes.push(source, highPass, lowPass, breezeGain, lfo, lfoGain);
  }
};

export const stopSound = (immediate = false) => {
  if (stopTimeout) clearTimeout(stopTimeout);

  const ctx = audioCtx;
  if (!ctx) return;

  const fadeTime = immediate ? 0.05 : 1.5;

  // Find the master gain node (usually the one connected to destination)
  activeNodes.forEach(node => {
    if (node instanceof GainNode) {
        try {
            node.gain.cancelScheduledValues(ctx.currentTime);
            node.gain.setValueAtTime(node.gain.value, ctx.currentTime);
            node.gain.linearRampToValueAtTime(0, ctx.currentTime + fadeTime);
        } catch(e) {}
    }
  });
  
  const performCleanup = () => {
    activeNodes.forEach(node => {
        try {
            node.disconnect();
            if (node instanceof AudioBufferSourceNode || node instanceof OscillatorNode) {
                node.stop();
            }
        } catch(e) {
            // Ignore errors on already stopped nodes
        }
    });
    activeNodes = [];
  };

  if (immediate) {
      performCleanup();
  } else {
      stopTimeout = setTimeout(performCleanup, fadeTime * 1000 + 100);
  }
};
