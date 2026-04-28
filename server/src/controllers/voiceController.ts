import { Request, Response } from 'express';
import https from 'https';

const API_KEY = 'YowYZOKyne8t9zJ2Gx8wAi9u';
const SECRET_KEY = 'PEVzQGrsW1QD13gMseJE8Fng5MOXPi2U';

// Utility for native HTTPS request that returns a promise
const requestHttps = (url: string, options: https.RequestOptions, postData?: string): Promise<any> => {
    return new Promise((resolve, reject) => {
        const req = https.request(url, options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch (e) {
                    reject(e);
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

async function getAccessToken(): Promise<string> {
    const url = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${API_KEY}&client_secret=${SECRET_KEY}`;
    const data = await requestHttps(url, { method: 'POST' });
    if (data.error) {
        throw new Error(`Baidu Auth Error: ${data.error_description}`);
    }
    return data.access_token;
}

export const recognizeVoice = async (req: Request, res: Response): Promise<void> => {
    try {
        const { audioBase64 } = req.body;
        
        if (!audioBase64) {
            res.status(400).json({ message: 'No audio data provided' });
            return;
        }

        const token = await getAccessToken();

        // Calculate raw byte length of the PCM decoded buffer
        const audioBuffer = Buffer.from(audioBase64, 'base64');

        const baiduPayload = JSON.stringify({
            format: 'pcm',
            rate: 16000,
            channel: 1,
            cuid: 'wisdom_elderly_platform',
            token: token,
            dev_pid: 1537,
            speech: audioBase64,
            len: audioBuffer.length
        });

        const vopUrl = 'https://vop.baidu.com/server_api';
        
        const result = await requestHttps(vopUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(baiduPayload)
            }
        }, baiduPayload);

        if (result.err_no === 0) {
            res.json({ result: result.result[0] }); // Baidu returns an array of possible results
        } else {
            console.error('Baidu API Error Result:', result);
            res.status(500).json({ message: `语音识别失败: ${result.err_msg || '未知错误'}` });
        }

    } catch (error: any) {
        console.error('[VoiceController] Recognize Error:', error);
        res.status(500).json({ message: '服务器内部错误，语音识别失败' });
    }
};
