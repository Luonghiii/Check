// api/tiktok.js
const https = require('https');
const http = require('http');

/**
 * Giải quyết URL rút gọn TikTok
 */
async function resolveTiktokUrl(idOrUrl) {
    // Nếu là URL rút gọn
    if (idOrUrl.includes('vt.tiktok.com') || idOrUrl.includes('vm.tiktok.com')) {
        return await followRedirect(idOrUrl);
    }
    
    // Nếu là URL đầy đủ TikTok
    if (idOrUrl.includes('tiktok.com')) {
        return idOrUrl;
    }
    
    // Nếu chỉ là ID video
    if (/^\d+$/.test(idOrUrl)) {
        return `https://www.tiktok.com/@user/video/${idOrUrl}`;
    }
    
    return null;
}

/**
 * Follow redirect để lấy URL đầy đủ
 */
function followRedirect(url) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        
        const options = {
            method: 'HEAD',
            headers: getDefaultHeaders()
        };
        
        const req = protocol.request(url, options, (res) => {
            if (res.statusCode === 301 || res.statusCode === 302) {
                resolve(res.headers.location);
            } else {
                resolve(url);
            }
        });
        
        req.on('error', reject);
        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('Timeout'));
        });
        req.end();
    });
}

/**
 * Lấy nội dung trang web
 */
function fetchPageContent(url) {
    return new Promise((resolve, reject) => {
        https.get(url, {
            headers: getDefaultHeaders(),
            timeout: 15000
        }, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                if (res.statusCode === 200) {
                    resolve(data);
                } else {
                    resolve(null);
                }
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

/**
 * Trích xuất dữ liệu video từ HTML
 */
function extractVideoData(html) {
    try {
        // Tìm script tag chứa dữ liệu
        const scriptMatch = html.match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>(.*?)<\/script>/s);
        
        if (!scriptMatch) {
            return null;
        }
        
        const jsonData = JSON.parse(scriptMatch[1]);
        
        // Kiểm tra cấu trúc dữ liệu
        if (!jsonData.__DEFAULT_SCOPE__ || 
            !jsonData.__DEFAULT_SCOPE__['webapp.video-detail'] ||
            !jsonData.__DEFAULT_SCOPE__['webapp.video-detail'].itemInfo ||
            !jsonData.__DEFAULT_SCOPE__['webapp.video-detail'].itemInfo.itemStruct) {
            return null;
        }
        
        return jsonData.__DEFAULT_SCOPE__['webapp.video-detail'].itemInfo.itemStruct;
    } catch (error) {
        return null;
    }
}

/**
 * Lấy video chất lượng cao nhất
 */
function getBestQualityVideo(postData) {
    if (!postData.video || !postData.video.bitrateInfo || postData.video.bitrateInfo.length === 0) {
        return null;
    }
    
    let bestBitrateInfo = null;
    let maxResolution = 0;
    
    for (const bitrateInfo of postData.video.bitrateInfo) {
        if (!bitrateInfo.PlayAddr || !bitrateInfo.PlayAddr.Width || !bitrateInfo.PlayAddr.Height) {
            continue;
        }
        
        const resolution = bitrateInfo.PlayAddr.Width * bitrateInfo.PlayAddr.Height;
        
        if (resolution > maxResolution) {
            maxResolution = resolution;
            bestBitrateInfo = bitrateInfo;
        }
    }
    
    return bestBitrateInfo ? bestBitrateInfo.PlayAddr : null;
}

/**
 * Format dữ liệu response
 */
function formatResponseData(postData, bestVideo, startTime) {
    return {
        status: 'success',
        processed_time: parseFloat(((Date.now() - startTime) / 1000).toFixed(4)),
        data: {
            id: postData.id || '',
            region: postData.locationCreated || '',
            title: postData.desc || '',
            cover: postData.video?.cover || '',
            duration: postData.video?.duration || 0,
            play: {
                DataSize: bestVideo?.DataSize || '',
                Width: bestVideo?.Width || 0,
                Height: bestVideo?.Height || 0,
                Uri: bestVideo?.Uri || '',
                UrlList: bestVideo?.UrlList || [],
                UrlKey: bestVideo?.UrlKey || '',
                FileHash: bestVideo?.FileHash || '',
                FileCs: bestVideo?.FileCs || '',
            },
            music_info: {
                id: postData.music?.id || '',
                title: postData.music?.title || '',
                playUrl: postData.music?.playUrl || '',
                cover: postData.music?.coverLarge || '',
                author: postData.music?.authorName || '',
                original: postData.music?.original || false,
                duration: postData.music?.preciseDuration?.preciseDuration || 0,
            },
            create_time: postData.createTime || '',
            stats: {
                diggCount: postData.stats?.diggCount || 0,
                shareCount: postData.stats?.shareCount || 0,
                commentCount: postData.stats?.commentCount || 0,
                playCount: postData.stats?.playCount || 0,
                collectCount: postData.stats?.collectCount || 0,
            },
            author: {
                id: postData.author?.id || '',
                uniqueId: postData.author?.uniqueId || '',
                nickname: postData.author?.nickname || '',
                avatarLarger: postData.author?.avatarLarger || '',
                signature: postData.author?.signature || '',
                verified: postData.author?.verified || false,
            },
            diversificationLabels: postData.diversificationLabels || [],
            suggestedWords: postData.suggestedWords || [],
            contents: formatContents(postData.contents || [])
        }
    };
}

/**
 * Format contents và hashtags
 */
function formatContents(contents) {
    return contents.map(content => ({
        textExtra: (content.textExtra || []).map(textExtra => ({
            hashtagName: textExtra.hashtagName || ''
        }))
    }));
}

/**
 * Lấy headers mặc định
 */
function getDefaultHeaders() {
    return {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0'
    };
}

/**
 * Parse TikTok post
 */
async function parseTiktokPost(idOrUrl) {
    const startTime = Date.now();
    
    // Validate input
    if (!idOrUrl) {
        return {
            status: 'error',
            message: 'URL không được để trống'
        };
    }

    try {
        // Xử lý URL rút gọn TikTok
        const url = await resolveTiktokUrl(idOrUrl);
        
        if (!url) {
            return {
                status: 'error',
                message: 'Không thể xử lý URL'
            };
        }

        // Lấy nội dung trang
        const response = await fetchPageContent(url);
        
        if (!response) {
            return {
                status: 'error',
                message: 'Không thể tải trang TikTok. Vui lòng kiểm tra lại URL.'
            };
        }

        // Parse dữ liệu từ HTML
        const postData = extractVideoData(response);
        
        if (!postData) {
            return {
                status: 'error',
                message: 'Không tìm thấy dữ liệu video. URL có thể không hợp lệ hoặc video đã bị xóa.'
            };
        }

        // Lấy video chất lượng cao nhất
        const bestVideo = getBestQualityVideo(postData);

        // Tạo response
        return formatResponseData(postData, bestVideo, startTime);
    } catch (error) {
        return {
            status: 'error',
            message: 'Đã xảy ra lỗi: ' + error.message
        };
    }
}

// ==================== VERCEL SERVERLESS FUNCTION ====================

module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Lấy URL từ query hoặc body
    const idOrUrl = req.query.url || req.body?.url || '';

    if (!idOrUrl) {
        return res.status(400).json({
            status: 'error',
            message: 'Vui lòng cung cấp URL video TikTok bằng cách thêm tham số "?url=" vào URL.',
            example: {
                full_url: '?url=https://www.tiktok.com/@username/video/1234567890',
                short_url: '?url=https://vt.tiktok.com/ZS23K2jtk/',
                video_id: '?url=7422250015885675783'
            }
        });
    }

    // Parse và trả về kết quả
    const result = await parseTiktokPost(idOrUrl);
    
    const statusCode = result.status === 'success' ? 200 : 400;
    return res.status(statusCode).json(result);
};
