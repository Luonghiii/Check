const https = require('https');

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatInput(input) {
    input = input.trim();
    try {
        const url = new URL(input);
        const parts = url.pathname.split('/');
        let username = parts.pop() || parts.pop();
        return username.replace(/^@/, '');
    } catch (e) {
        if (input.startsWith('@')) {
            return input.slice(1);
        }
        return input;
    }
}

function fetchHTML(url, headers = {}) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

function toVietnamTime(timestamp) {
    const date = new Date(timestamp * 1000);
    const time = date.toLocaleTimeString('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    const day = date.toLocaleDateString('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });

    return `${time} || ${day}`;
}

function toISOTime(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toISOString().slice(0, 19).replace('T', ' ');
}

// Country flags mapping
const flags = {
    "VN": "Việt Nam 🇻🇳", "US": "United States 🇺🇸", "GB": "United Kingdom 🇬🇧",
    "DE": "Germany 🇩🇪", "FR": "France 🇫🇷", "JP": "Japan 🇯🇵",
    "KR": "South Korea 🇰🇷", "CN": "China 🇨🇳", "TH": "Thailand 🇹🇭",
    "ID": "Indonesia 🇮🇩", "MY": "Malaysia 🇲🇾", "SG": "Singapore 🇸🇬",
    "PH": "Philippines 🇵🇭", "IN": "India 🇮🇳", "BR": "Brazil 🇧🇷",
    "MX": "Mexico 🇲🇽", "CA": "Canada 🇨🇦", "AU": "Australia 🇦🇺",
    "IT": "Italy 🇮🇹", "ES": "Spain 🇪🇸", "RU": "Russia 🇷🇺",
    "TR": "Turkey 🇹🇷", "SA": "Saudi Arabia 🇸🇦", "AE": "United Arab Emirates 🇦🇪",
    "EG": "Egypt 🇪🇬", "ZA": "South Africa 🇿🇦", "AR": "Argentina 🇦🇷",
    "CL": "Chile 🇨🇱", "CO": "Colombia 🇨🇴", "PE": "Peru 🇵🇪",
    "PL": "Poland 🇵🇱", "UA": "Ukraine 🇺🇦", "NL": "Netherlands 🇳🇱",
    "BE": "Belgium 🇧🇪", "CH": "Switzerland 🇨🇭", "SE": "Sweden 🇸🇪",
    "NO": "Norway 🇳🇴", "DK": "Denmark 🇩🇰", "FI": "Finland 🇫🇮",
    "PT": "Portugal 🇵🇹", "GR": "Greece 🇬🇷", "CZ": "Czechia 🇨🇿",
    "RO": "Romania 🇷🇴", "HU": "Hungary 🇭🇺", "AT": "Austria 🇦🇹",
    "IE": "Ireland 🇮🇪", "NZ": "New Zealand 🇳🇿", "IL": "Israel 🇮🇱",
    "TW": "Taiwan 🇹🇼", "HK": "Hong Kong SAR China 🇭🇰", "PK": "Pakistan 🇵🇰",
    "BD": "Bangladesh 🇧🇩", "NG": "Nigeria 🇳🇬", "KE": "Kenya 🇰🇪",
    "MA": "Morocco 🇲🇦", "DZ": "Algeria 🇩🇿", "TN": "Tunisia 🇹🇳",
    "JO": "Jordan 🇯🇴", "LB": "Lebanon 🇱🇧", "IQ": "Iraq 🇮🇶",
    "KW": "Kuwait 🇰🇼", "QA": "Qatar 🇶🇦", "OM": "Oman 🇴🇲",
    "BH": "Bahrain 🇧🇭", "YE": "Yemen 🇾🇪", "SY": "Syria 🇸🇾"
};

// User-Agent rotation
const userAgentList = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.0 Safari/605.1.15",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile Safari/604.1",
    "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36"
];

function getSafeUserAgent(headerUA) {
    if (headerUA && headerUA.length > 10) return headerUA;
    const index = Math.floor(Math.random() * userAgentList.length);
    return userAgentList[index];
}

// ============================================
// ENHANCED ANALYTICS FUNCTIONS
// ============================================

function calculateEngagementRate(stats) {
    if (stats.followerCount === 0 || stats.videoCount === 0) return 0;
    return ((stats.heart / stats.followerCount / stats.videoCount) * 100).toFixed(2);
}

function calculateQualityScore(user, stats) {
    let score = 0;
    
    // Verification (+20)
    if (user.verified) score += 20;
    
    // Followers
    if (stats.followerCount >= 1000000) score += 25;
    else if (stats.followerCount >= 100000) score += 20;
    else if (stats.followerCount >= 10000) score += 15;
    else if (stats.followerCount >= 1000) score += 10;
    else if (stats.followerCount >= 100) score += 5;
    
    // Videos
    if (stats.videoCount >= 100) score += 15;
    else if (stats.videoCount >= 50) score += 12;
    else if (stats.videoCount >= 10) score += 8;
    else if (stats.videoCount >= 1) score += 5;
    
    // Engagement
    const engagement = parseFloat(calculateEngagementRate(stats));
    if (engagement >= 20) score += 25;
    else if (engagement >= 10) score += 20;
    else if (engagement >= 5) score += 15;
    else if (engagement >= 2) score += 10;
    else if (engagement >= 1) score += 5;
    
    // Account age (estimate based on ID - higher ID = newer)
    const idLength = user.id.length;
    if (idLength >= 19) score += 5; // Older accounts
    
    // Privacy settings (open = better for growth)
    if (!user.privateAccount) score += 3;
    if (user.duetSetting === 0) score += 2;
    if (user.stitchSetting === 0) score += 2;
    if (user.commentSetting === 0) score += 3;
    
    return Math.min(score, 100);
}

function getAccountType(user, stats) {
    // Verified + high followers
    if (user.verified && stats.followerCount >= 100000) {
        return "🌟 Celebrity/Influencer";
    }
    
    // TikTok Seller
    if (user.ttSeller || user.commerceUserInfo?.commerceUser) {
        return "🛍️ TikTok Shop Seller";
    }
    
    // High followers but not verified
    if (stats.followerCount >= 100000) {
        return "⭐ Top Creator";
    }
    
    // Mid-tier
    if (stats.followerCount >= 10000) {
        return "📈 Growing Creator";
    }
    
    if (stats.followerCount >= 1000) {
        return "🎯 Micro Influencer";
    }
    
    if (stats.followerCount >= 100) {
        return "🌱 Nano Creator";
    }
    
    return "👤 Regular User";
}

function getPrivacyLevel(user) {
    let openSettings = 0;
    const total = 6;
    
    if (!user.privateAccount) openSettings++;
    if (user.commentSetting === 0) openSettings++;
    if (user.duetSetting === 0) openSettings++;
    if (user.stitchSetting === 0) openSettings++;
    if (user.downloadSetting === 0) openSettings++;
    if (user.followingVisibility === 1) openSettings++;
    
    const percentage = (openSettings / total * 100).toFixed(0);
    
    if (percentage >= 80) return { level: "🔓 Very Open", score: percentage };
    if (percentage >= 60) return { level: "🔓 Open", score: percentage };
    if (percentage >= 40) return { level: "🔒 Moderate", score: percentage };
    if (percentage >= 20) return { level: "🔒 Private", score: percentage };
    return { level: "🔐 Very Private", score: percentage };
}

function formatNumber(num) {
    if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'B';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

function getGrowthPotential(user, stats) {
    const insights = [];
    
    // Posting frequency
    const avgPostsPerDay = stats.videoCount / 365; // Rough estimate
    if (avgPostsPerDay < 0.5) {
        insights.push("📊 Low posting frequency - Post more regularly (aim for 1-3 videos/day)");
    }
    
    // Engagement
    const engagement = parseFloat(calculateEngagementRate(stats));
    if (engagement < 2) {
        insights.push("💬 Low engagement rate - Reply to comments, use trending sounds");
    } else if (engagement > 10) {
        insights.push("🔥 Excellent engagement! Keep up the great content");
    }
    
    // Privacy blocking growth
    if (user.privateAccount) {
        insights.push("🔓 Private account limits discoverability - Consider going public");
    }
    
    if (user.duetSetting !== 0) {
        insights.push("🎭 Enable duets to boost discoverability");
    }
    
    if (user.stitchSetting !== 0) {
        insights.push("✂️ Enable stitches for more content opportunities");
    }
    
    // Bio optimization
    if (!user.signature || user.signature.length < 20) {
        insights.push("✍️ Add a compelling bio with keywords and call-to-action");
    }
    
    // Commerce opportunity
    if (stats.followerCount >= 1000 && !user.ttSeller) {
        insights.push("💰 You're eligible for TikTok Shop - Consider monetizing");
    }
    
    if (insights.length === 0) {
        insights.push("✅ Profile is well-optimized! Focus on consistent, quality content");
    }
    
    return insights;
}

// ============================================
// MAIN HANDLER
// ============================================

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const input = req.query.input || req.query.username;
    if (!input) {
        return res.status(400).json({
            success: false,
            error: 'Missing parameter. Add ?input=username or ?input=tiktok_url'
        });
    }

    try {
        const username = formatInput(input);
        const url = `https://www.tiktok.com/@${encodeURIComponent(username)}`;
        const userAgent = getSafeUserAgent(req.headers['user-agent']);

        // Fetch HTML
        const html = await fetchHTML(url, {
            'User-Agent': userAgent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive'
        });

        // Extract JSON data
        const match = html.match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__" type="application\/json">(.*?)<\/script>/s);
        if (!match) {
            return res.status(404).json({ 
                success: false,
                error: 'User not found or TikTok changed their HTML structure' 
            });
        }

        const jsonData = JSON.parse(match[1]);
        const userData = jsonData?.__DEFAULT_SCOPE__?.['webapp.user-detail'];
        
        if (!userData || !userData.userInfo) {
            return res.status(404).json({ 
                success: false,
                error: 'User data not found. The username may not exist.' 
            });
        }

        const user = userData.userInfo.user;
        const stats = userData.userInfo.stats;
        const statsV2 = userData.userInfo.statsV2;

        // Apply region flag
        if (user.region && flags[user.region]) {
            user.region = flags[user.region];
        }

        // ============================================
        // FORMAT DATA (Script 1 style)
        // ============================================
        
        const profile = {
            "Nickname": user.nickname || "N/A",
            "Username": `@${user.uniqueId}`,
            "Country": user.region || "N/A",
            "Language": user.language || "N/A",
            "About": user.signature || "No bio",
            "User ID": user.id,
            "SecUID": user.secUid,
            "Bio Link": user.bioLink?.link || "",
            "Account Created": user.createTime ? toISOTime(user.createTime) : "N/A",
            "Nickname Last Modified": user.nickNameModifyTime ? toISOTime(user.nickNameModifyTime) : "N/A",
            "Username Last Modified": user.uniqueIdModifyTime ? toISOTime(user.uniqueIdModifyTime) : "Never changed",
            "Avatar URL": user.avatarLarger || user.avatarMedium || user.avatarThumb,
            "Avatar Thumb": user.avatarThumb,
            "Avatar Medium": user.avatarMedium,
            "Avatar Large": user.avatarLarger
        };

        const basicStats = {
            "Followers": formatNumber(stats.followerCount),
            "Following": formatNumber(stats.followingCount),
            "Hearts": formatNumber(stats.heart),
            "Videos": stats.videoCount.toString(),
            "Friends": stats.friendCount ? stats.friendCount.toString() : "0"
        };

        // ============================================
        // ENHANCED DATA (Script 2 + Analytics)
        // ============================================
        
        const enhancedData = {
            // Status badges
            status: {
                verified: user.verified,
                private: user.privateAccount,
                seller: user.ttSeller,
                commerceUser: user.commerceUserInfo?.commerceUser || false,
                ftc: user.ftc,
                organization: user.isOrganization === 1
            },
            
            // Privacy settings
            privacy: {
                accountType: user.privateAccount ? "Private" : "Public",
                commentsAllowed: user.commentSetting === 0 ? "Everyone" : user.commentSetting === 1 ? "Friends" : "Off",
                duetsAllowed: user.duetSetting === 0,
                stitchAllowed: user.stitchSetting === 0,
                downloadAllowed: user.downloadSetting === 0,
                followingVisible: user.followingVisibility === 1,
                privacyLevel: getPrivacyLevel(user)
            },
            
            // Calculated metrics
            metrics: {
                engagementRate: calculateEngagementRate(stats) + "%",
                qualityScore: calculateQualityScore(user, stats),
                accountType: getAccountType(user, stats),
                avgLikesPerVideo: stats.videoCount > 0 ? Math.floor(stats.heart / stats.videoCount) : 0,
                followerToFollowingRatio: stats.followingCount > 0 ? (stats.followerCount / stats.followingCount).toFixed(2) : "∞"
            },
            
            // Growth insights
            insights: {
                growthTips: getGrowthPotential(user, stats),
                nextMilestone: stats.followerCount < 1000 ? "1K Followers" :
                              stats.followerCount < 10000 ? "10K Followers" :
                              stats.followerCount < 100000 ? "100K Followers" :
                              stats.followerCount < 1000000 ? "1M Followers" : "10M Followers"
            },
            
            // Raw stats for advanced use
            rawStats: {
                followerCount: stats.followerCount,
                followingCount: stats.followingCount,
                heartCount: stats.heart,
                videoCount: stats.videoCount,
                diggCount: stats.diggCount || 0,
                friendCount: stats.friendCount || 0
            },
            
            // Additional info
            additional: {
                shortId: user.shortId || "N/A",
                roomId: user.roomId || "Not live",
                relation: user.relation,
                openFavorite: user.openFavorite,
                canExpPlaylist: user.canExpPlaylist,
                isEmbedBanned: user.isEmbedBanned,
                profileTab: user.profileTab || {}
            }
        };

        // ============================================
        // FINAL RESPONSE (Combined both scripts)
        // ============================================
        
        return res.status(200).json({
            success: true,
            timestamp: new Date().toISOString(),
            
            // Script 1 format (for compatibility)
            profile: profile,
            stats: basicStats,
            
            // Script 2 raw data (for advanced use)
            raw: {
                userInfo: userData.userInfo,
                shareMeta: userData.shareMeta
            },
            
            // Enhanced analytics
            enhanced: enhancedData,
            
            // Quick access
            quick: {
                username: user.uniqueId,
                nickname: user.nickname,
                avatar: user.avatarLarger,
                followers: stats.followerCount,
                verified: user.verified,
                private: user.privateAccount,
                qualityScore: calculateQualityScore(user, stats),
                engagementRate: calculateEngagementRate(stats),
                profileUrl: `https://www.tiktok.com/@${user.uniqueId}`
            }
        });

    } catch (err) {
        console.error('Error:', err);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch TikTok data: ' + err.message
        });
    }
};
