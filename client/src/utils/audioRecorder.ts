class AudioRecorder {
    private stream: MediaStream | null = null;
    private audioContext: AudioContext | null = null;
    private scriptProcessor: ScriptProcessorNode | null = null;
    private audioData: Int16Array[] = [];

    async start() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('浏览器不支持麦克风录音');
        }

        this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Baidu requires 16000Hz sample rate
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        this.audioContext = new AudioContextClass({ sampleRate: 16000 });
        
        const source = this.audioContext.createMediaStreamSource(this.stream);
        
        // Use 4096 buffer size, 1 input channel (mono), 1 output channel
        this.scriptProcessor = this.audioContext.createScriptProcessor(4096, 1, 1);
        
        source.connect(this.scriptProcessor);
        this.scriptProcessor.connect(this.audioContext.destination);

        this.scriptProcessor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0); // mono
            const pcm16 = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) {
                // Convert Float32 [-1.0, 1.0] to Int16 [-32768, 32767]
                const s = Math.max(-1, Math.min(1, inputData[i]));
                pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
            }
            this.audioData.push(pcm16);
        };
    }

    stop(): Promise<string> {
        return new Promise((resolve) => {
            if (this.stream) {
                this.stream.getTracks().forEach(track => track.stop());
            }
            if (this.scriptProcessor && this.audioContext) {
                this.scriptProcessor.disconnect();
                this.audioContext.close();
            }

            // Flatten Int16Array[]
            const totalLength = this.audioData.reduce((acc, val) => acc + val.length, 0);
            const result = new Int16Array(totalLength);
            let offset = 0;
            for (const pcm of this.audioData) {
                result.set(pcm, offset);
                offset += pcm.length;
            }

            // Convert raw PCM Int16Array to Base64
            const buffer = result.buffer;
            const bytes = new Uint8Array(buffer);
            let binary = '';
            // Process in chunks to avoid call stack limits on huge arrays
            for (let i = 0; i < bytes.byteLength; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            const base64Str = btoa(binary);

            this.audioData = []; // Clear for next recording
            resolve(base64Str);
        });
    }
}

export default new AudioRecorder();
