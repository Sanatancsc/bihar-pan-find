// /api/findpan.js
import fetch from 'node-fetch';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { aadhaar_number } = req.body;

    if (!aadhaar_number) {
        return res.status(400).json({ error: 'Aadhaar number is required' });
    }

    const apiKey = process.env.PORTAL_API_KEY;
    const username = process.env.PORTAL_USERNAME;

    // multipart/form-data पेलोड
    const boundary = '----WebKitFormBoundaryXS1q4EVJ0Qe6yeP3';
    const data = 
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="panservertype"\r\n\r\n` +
        `server1\r\n` +
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="selAadhaar"\r\n\r\n` +
        `${aadhaar_number}\r\n` +
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="submit"\r\n\r\n` +
        `Instant Search\r\n` +
        `--${boundary}--\r\n`;

    try {
        const response = await fetch('https://codenaxus.xyz/instantpanfind', {
            method: 'POST',
            headers: {
                // यहाँ हम पोर्टल की मुख्य सुरक्षा चाबियाँ भेज रहे हैं
                'X-API-KEY': apiKey, 
                'X-USER-ID': username,
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'Origin': 'https://codenaxus.xyz',
                'Referer': 'https://codenaxus.xyz/instantpanfind',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            body: data
        });

        const htmlResult = await response.text();

        // 🔍 HTML में से PAN नंबर और नाम ढूंढने के लिए सिंपल Regex (Scraping)
        // नोट: अगर रिस्पॉन्स का स्ट्रक्चर पता हो तो इसे और सटीक किया जा सकता है
        const panRegex = /[A-Z]{5}[0-7]{4}[A-Z]{1}/; // स्टैंडर्ड पैन कार्ड फॉर्मेट
        const matchedPan = htmlResult.match(panRegex);

        if (matchedPan) {
            return res.status(200).json({
                status: 'success',
                aadhaar: aadhaar_number,
                pan_number: matchedPan[0],
                // अगर आप पूरा पेज भी देखना चाहें तो:
                // raw_html: htmlResult 
            });
        } else {
            // अगर पैन नंबर नहीं मिला या आधार गलत हुआ
            return res.status(200).json({ 
                status: 'failed', 
                message: 'PAN not found or invalid Aadhaar number.',
                html_preview: htmlResult.substring(0, 500) // जांचने के लिए शुरुआती कुछ अक्षर
            });
        }

    } catch (error) {
        res.status(500).json({ error: 'Portal request failed', details: error.message });
    }
}
