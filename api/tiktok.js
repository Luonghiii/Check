// api/tiktok.js - Version 2.0 with Anti-Detection
const https = require('https');
const http = require('http');

/**
 * Enhanced headers với browser fingerprinting
 */
function getEnhancedHeaders(referer = '') {
    return {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Cache-Control': 'max-age=0',
        'Referer': referer || 'https://www.tiktok.com/',
        'Origin': 'https://www.tiktok.com'
    };
}

/**
 * Giải quyết URL rút gọn TikTok
 */
async function resolveTiktokUrl(idOrUrl) {
    if (idOrUrl.includes('vt.tiktok.com') || idOrUrl.includes('vm.tiktok.com')) {
        try {
            return await followRedirect(idOrUrl);
        } catch (error) {
            console.error('Error resolving short URL:', error.message);
            return null;
        }
    }
    
    if (idOrUrl.includes('tiktok.com/@') && idOrUrl.includes('/video/')) {
        return idOrUrl;
    }
    
    if (/^\d+$/.test(idOrUrl)) {
        return `https://www.tiktok.com/@tiktok/video/${idOrUrl}`;
    }
    
    return null;
}

/**
 * Follow redirect với timeout
 */
function followRedirect(url) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        
        const options = {
            method: 'HEAD',
            headers: getEnhancedHeaders(),
            timeout: 10000
        };
        
        const req = protocol.request(url, options, (res) => {
            if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 303 || res.statusCode === 307 || res.statusCode === 308) {
                const location = res.headers.location;
                if (location) {
                    // Nếu location là relative URL
                    if (location.startsWith('/')) {
                        resolve(`https://www.tiktok.com${location}`);
                    } else {
                        resolve(location);
                    }
                } else {
                    reject(new Error('No location header in redirect'));
                }
            } else {
                resolve(url);
            }
        });
        
        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
        req.end();
    });
}

/**
 * Fetch page content với retry mechanism
 */
async function fetchPageContent(url, retries = 2) {
    for (let i = 0; i <= retries; i++) {
        try {
            const content = await fetchPage(url);
            if (content && content.length > 1000) { // Ensure we got actual content
                return content;
            }
        } catch (error) {
            console.error(`Attempt ${i + 1} failed:`, error.message);
            if (i === retries) throw error;
            await sleep(1000 * (i + 1)); // Exponential backoff
        }
    }
    return null;
}

/**
 * Fetch single page
 */
function fetchPage(url) {
    return new Promise((resolve, reject) => {
        const parsedUrl = new URL(url);
        
        const options = {
            hostname: parsedUrl.hostname,
            path: parsedUrl.pathname + parsedUrl.search,
            method: 'GET',
            headers: getEnhancedHeaders(url),
            timeout: 20000
        };
        
        const req = https.request(options, (res) => {
            let data = '';
            
            // Handle redirects
            if (res.statusCode === 301 || res.statusCode === 302) {
                return resolve(fetchPage(res.headers.location));
            }
            
            res.setEncoding('utf8');
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                if (res.statusCode === 200) {
                    resolve(data);
                } else {
                    reject(new Error(`HTTP ${res.statusCode}`));
                }
            });
        });
        
        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
        req.end();
    });
}

/**
 * Sleep helper
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Extract video data - Method 1: __UNIVERSAL_DATA_FOR_REHYDRATION__
 */
function extractVideoDataMethod1(html) {
    try {
        const scriptMatch = html.match(/<script[^>]*id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>(.*?)<\/script>/s);
        
        if (!scriptMatch) {
            return null;
        }
        
        const jsonData = JSON.parse(scriptMatch[1]);
        
        if (!jsonData.__DEFAULT_SCOPE__?.['webapp.video-detail']?.itemInfo?.itemStruct) {
            return null;
        }
        
        return jsonData.__DEFAULT_SCOPE__['webapp.video-detail'].itemInfo.itemStruct;
    } catch (error) {
        return null;
    }
}

/**
 * Extract video data - Method 2: SIGI_STATE
 */
function extractVideoDataMethod2(html) {
    try {
        const scriptMatch = html.match(/<script[^>]*id="SIGI_STATE"[^>]*>(.*?)<\/script>/s);
        
        if (!scriptMatch) {
            return null;
        }
        
        const jsonData = JSON.parse(scriptMatch[1]);
        
        // Try different possible paths
        const possiblePaths = [
            jsonData.ItemModule,
            jsonData.VideoDetail?.itemInfo?.itemStruct,
            jsonData.ItemList?.video?.list?.[0]
        ];
        
        for (const data of possiblePaths) {
            if (data && Object.keys(data).length > 0) {
                // If ItemModule, get first video
                if (typeof data === 'object' && !Array.isArray(data)) {
                    const firstKey = Object.keys(data)[0];
                    if (firstKey && data[firstKey]) {
                        return data[firstKey];
                    }
                }
                return data;
            }
        }
        
        return null;
    } catch (error) {
        return null;
    }
}

/**
 * Extract video data - Method 3: window object
 */
function extractVideoDataMethod3(html) {
    try {
        // Look for window['SIGI_STATE'] or similar patterns
        const patterns = [
            /window\['SIGI_STATE'\]\s*=\s*({.*?});/s,
            /window\["SIGI_STATE"\]\s*=\s*({.*?});/s,
            /__NEXT_DATA__.*?=\s*({.*?})<\/script>/s
        ];
        
        for (const pattern of patterns) {
            const match = html.match(pattern);
            if (match) {
                const jsonData = JSON.parse(match[1]);
                
                // Navigate through possible data structures
                if (jsonData.ItemModule) {
                    const firstKey = Object.keys(jsonData.ItemModule)[0];
                    if (firstKey) return jsonData.ItemModule[firstKey];
                }
                
                if (jsonData.props?.pageProps?.videoData) {
                    return jsonData.props.pageProps.videoData;
                }
            }
        }
        
        return null;
    } catch (error) {
        return null;
    }
}

/**
 * Try all extraction methods
 */
function extractVideoData(html) {
    // Method 1: Original __UNIVERSAL_DATA_FOR_REHYDRATION__
    let data = extractVideoDataMethod1(html);
    if (data) {
        console.log('Extracted using Method 1: __UNIVERSAL_DATA_FOR_REHYDRATION__');
        return data;
    }
    
    // Method 2: SIGI_STATE
    data = extractVideoDataMethod2(html);
    if (data) {
        console.log('Extracted using Method 2: SIGI_STATE');
        return data;
    }
    
    // Method 3: window object patterns
    data = extractVideoDataMethod3(html);
    if (data) {
        console.log('Extracted using Method 3: window object');
        return data;
    }
    
    // Debug: Save HTML to see structure
    console.log('HTML length:', html.length);
    console.log('Contains __UNIVERSAL:', html.includes('__UNIVERSAL_DATA_FOR_REHYDRATION__'));
    console.log('Contains SIGI_STATE:', html.includes('SIGI_STATE'));
    console.log('Contains ItemModule:', html.includes('ItemModule'));
    
    return null;
}

/**
 * Get best quality video
 */
function getBestQualityVideo(postData) {
    if (!postData.video?.bitrateInfo || postData.video.bitrateInfo.length === 0) {
        // Fallback to direct download URL if available
        if (postData.video?.downloadAddr) {
            return {
                UrlList: [postData.video.downloadAddr],
                Width: postData.video.width || 0,
                Height: postData.video.height || 0
            };
        }
        return null;
    }
    
    let bestBitrateInfo = null;
    let maxResolution = 0;
    
    for (const bitrateInfo of postData.video.bitrateInfo) {
        if (!bitrateInfo.PlayAddr?.Width || !bitrateInfo.PlayAddr?.Height) {
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
 * Format response data
 */
function formatResponseData(postData, bestVideo, startTime) {
    return {
        status: 'success',
        processed_time: parseFloat(((Date.now() - startTime) / 1000).toFixed(4)),
        data: {
            id: postData.id || '',
            region: postData.locationCreated || postData.region || '',
            title: postData.desc || postData.description || '',
            cover: postData.video?.cover || postData.video?.originCover || '',
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
                cover: postData.music?.coverLarge || postData.music?.coverMedium || '',
                author: postData.music?.authorName || '',
                original: postData.music?.original || false,
                duration: postData.music?.preciseDuration?.preciseDuration || postData.music?.duration || 0,
            },
            create_time: postData.createTime || postData.createTimeISO || '',
            stats: {
                diggCount: postData.stats?.diggCount || 0,
                shareCount: postData.stats?.shareCount || 0,
                commentCount: postData.stats?.commentCount || 0,
                playCount: postData.stats?.playCount || 0,
                collectCount: postData.stats?.collectCount || 0,
            },
            author: {
                id: postData.author?.id || postData.authorId || '',
                uniqueId: postData.author?.uniqueId || '',
                nickname: postData.author?.nickname || '',
                avatarLarger: postData.author?.avatarLarger || postData.author?.avatarMedium || '',
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
 * Format contents
 */
function formatContents(contents) {
    return contents.map(content => ({
        textExtra: (content.textExtra || []).map(textExtra => ({
            hashtagName: textExtra.hashtagName || ''
        }))
    }));
}

/**
 * Main parse function
 */
async function parseTiktokPost(idOrUrl) {
    const startTime = Date.now();
    
    if (!idOrUrl) {
        return {
            status: 'error',
            message: 'URL không được để trống'
        };
    }

    try {
        const url = await resolveTiktokUrl(idOrUrl);
        
        if (!url) {
            return {
                status: 'error',
                message: 'Không thể xử lý URL. Vui lòng kiểm tra định dạng URL.'
            };
        }

        console.log('Fetching URL:', url);
        const response = await fetchPageContent(url);
        
        if (!response) {
            return {
                status: 'error',
                message: 'Không thể tải trang TikTok. TikTok có thể đang chặn requests từ server.'
            };
        }

        const postData = extractVideoData(response);
        
        if (!postData) {
            return {
                status: 'error',
                message: 'Không tìm thấy dữ liệu video. Có thể: (1) Video đã bị xóa, (2) URL không hợp lệ, hoặc (3) TikTok đã thay đổi cấu trúc HTML.',
                debug: {
                    url: url,
                    htmlLength: response.length,
                    hasUniversalData: response.includes('__UNIVERSAL_DATA_FOR_REHYDRATION__'),
                    hasSigiState: response.includes('SIGI_STATE')
                }
            };
        }

        const bestVideo = getBestQualityVideo(postData);

        return formatResponseData(postData, bestVideo, startTime);
    } catch (error) {
        return {
            status: 'error',
            message: 'Đã xảy ra lỗi: ' + error.message,
            error_details: error.stack
        };
    }
}

// ==================== VERCEL SERVERLESS FUNCTION ====================

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const idOrUrl = req.query.url || req.body?.url || '';

    if (!idOrUrl) {
        return res.status(400).json({
            status: 'error',
            message: 'Vui lòng cung cấp URL video TikTok bằng cách thêm tham số "?url=" vào URL.',
            example: {
                full_url: '/tiktok?url=https://www.tiktok.com/@username/video/1234567890',
                short_url: '/tiktok?url=https://vt.tiktok.com/ZS23K2jtk/',
                video_id: '/tiktok?url=7422250015885675783'
            }
        });
    }

    const result = await parseTiktokPost(idOrUrl);
    
    const statusCode = result.status === 'success' ? 200 : 400;
    return res.status(statusCode).json(result);
};
