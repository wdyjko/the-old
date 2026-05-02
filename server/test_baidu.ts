import https from 'https';

const API_KEY = 'YowYZOKyne8t9zJ2Gx8wAi9u';
const SECRET_KEY = 'PEVzQGrsW1QD13gMseJE8Fng5MOXPi2U';

const requestHttps = (url: string, options: https.RequestOptions, postData?: string): Promise<any> => {
    return new Promise((resolve, reject) => {
        const req = https.request(url, options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch (e) {
                    reject(new Error(`Parse error: ${body}`));
                }
            });
        });
        req.on('error', (e) => reject(e));
        if (postData) {
            req.write(postData);
        }
        req.end();
    });
};

async function testBaidu() {
    try {
        console.log('1. Getting token...');
        const tokenUrl = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${API_KEY}&client_secret=${SECRET_KEY}`;
        const tokenData = await requestHttps(tokenUrl, { method: 'POST' });
        
        if (tokenData.error) {
            console.error('Token Error:', tokenData);
            return;
        }
        
        const token = tokenData.access_token;
        console.log('Token acquired:', token.substring(0, 10) + '...');

        // 2. Generate a valid 16kHz PCM (1 sec of silence or noise)
        console.log('2. Generating dummy audio...');
        const pcmData = Buffer.alloc(32000, 0); // 1 sec at 16000Hz * 2bytes/sample
        const base64Audio = pcmData.toString('base64');
        
        const payload = JSON.stringify({
            format: 'pcm',
            rate: 16000,
            channel: 1,
            cuid: 'wisdom_elderly_platform',
            token: token,
            dev_pid: 1537,
            speech: base64Audio,
            len: pcmData.length
        });
        
        console.log('3. Sending to Baidu Voice...');
        const vopUrl = 'https://vop.baidu.com/server_api';
        const result = await requestHttps(vopUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        }, payload);
        
        console.log('4. Baidu Response:', result);

    } catch (e) {
        console.error('Exception caught:', e);
    }
}

testBaidu();
