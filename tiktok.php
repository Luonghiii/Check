<?php
// Tắt hiển thị lỗi để tránh làm hỏng JSON response
error_reporting(0);
ini_set('display_errors', 0);

/**
 * Hàm lấy thông tin video TikTok
 * @param string $id_or_url - URL hoặc ID video TikTok
 * @return array - Dữ liệu video hoặc lỗi
 */
function parse_tiktok_post($id_or_url) {
    $start_time = microtime(true);
    
    // Validate input
    if (empty($id_or_url)) {
        return [
            'status' => 'error',
            'message' => 'URL không được để trống'
        ];
    }

    // Xử lý URL rút gọn TikTok
    $url = resolve_tiktok_url($id_or_url);
    
    if (!$url) {
        return [
            'status' => 'error',
            'message' => 'Không thể xử lý URL'
        ];
    }

    // Lấy nội dung trang
    $response = fetch_page_content($url);
    
    if (!$response) {
        return [
            'status' => 'error',
            'message' => 'Không thể tải trang TikTok. Vui lòng kiểm tra lại URL.'
        ];
    }

    // Parse dữ liệu từ HTML
    $post_data = extract_video_data($response);
    
    if (!$post_data) {
        return [
            'status' => 'error',
            'message' => 'Không tìm thấy dữ liệu video. URL có thể không hợp lệ hoặc video đã bị xóa.'
        ];
    }

    // Lấy video chất lượng cao nhất
    $best_video = get_best_quality_video($post_data);

    // Tạo response
    $parsed_data = format_response_data($post_data, $best_video, $start_time);

    return $parsed_data;
}

/**
 * Giải quyết URL rút gọn TikTok
 */
function resolve_tiktok_url($id_or_url) {
    // Nếu là URL rút gọn (vt.tiktok.com hoặc vm.tiktok.com)
    if (strpos($id_or_url, 'vt.tiktok.com') !== false || 
        strpos($id_or_url, 'vm.tiktok.com') !== false) {
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $id_or_url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_HEADER, true);
        curl_setopt($ch, CURLOPT_NOBODY, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        curl_setopt($ch, CURLOPT_HTTPHEADER, get_default_headers());
        
        curl_exec($ch);
        $url = curl_getinfo($ch, CURLINFO_EFFECTIVE_URL);
        curl_close($ch);
        
        return $url ?: false;
    }
    
    // Nếu là URL đầy đủ TikTok
    if (strpos($id_or_url, 'tiktok.com') !== false) {
        return $id_or_url;
    }
    
    // Nếu chỉ là ID video
    if (is_numeric($id_or_url)) {
        return "https://www.tiktok.com/@user/video/{$id_or_url}";
    }
    
    return false;
}

/**
 * Lấy nội dung trang web
 */
function fetch_page_content($url) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    curl_setopt($ch, CURLOPT_HTTPHEADER, get_default_headers());
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    return ($http_code == 200 && $response) ? $response : false;
}

/**
 * Trích xuất dữ liệu video từ HTML
 */
function extract_video_data($html) {
    $dom = new DOMDocument();
    @$dom->loadHTML($html);
    $xpath = new DOMXPath($dom);
    
    // Tìm script chứa dữ liệu
    $script = $xpath->query("//script[@id='__UNIVERSAL_DATA_FOR_REHYDRATION__']");
    
    if ($script->length === 0) {
        return null;
    }
    
    $json_data = $script->item(0)->textContent;
    $data = json_decode($json_data, true);
    
    // Kiểm tra cấu trúc dữ liệu
    if (!isset($data['__DEFAULT_SCOPE__']['webapp.video-detail']['itemInfo']['itemStruct'])) {
        return null;
    }
    
    return $data['__DEFAULT_SCOPE__']['webapp.video-detail']['itemInfo']['itemStruct'];
}

/**
 * Lấy video chất lượng cao nhất
 */
function get_best_quality_video($post_data) {
    if (!isset($post_data['video']['bitrateInfo']) || empty($post_data['video']['bitrateInfo'])) {
        return null;
    }
    
    $best_bitrate_info = null;
    $max_resolution = 0;
    
    foreach ($post_data['video']['bitrateInfo'] as $bitrate_info) {
        if (!isset($bitrate_info['PlayAddr']['Width']) || !isset($bitrate_info['PlayAddr']['Height'])) {
            continue;
        }
        
        $resolution = $bitrate_info['PlayAddr']['Width'] * $bitrate_info['PlayAddr']['Height'];
        
        if ($resolution > $max_resolution) {
            $max_resolution = $resolution;
            $best_bitrate_info = $bitrate_info;
        }
    }
    
    return $best_bitrate_info ? $best_bitrate_info['PlayAddr'] : null;
}

/**
 * Format dữ liệu response
 */
function format_response_data($post_data, $best_video, $start_time) {
    return [
        'status' => 'success',
        'processed_time' => round(microtime(true) - $start_time, 4),
        'data' => [
            'id' => $post_data['id'] ?? '',
            'region' => $post_data['locationCreated'] ?? '',
            'title' => $post_data['desc'] ?? '',
            'cover' => $post_data['video']['cover'] ?? '',
            'duration' => $post_data['video']['duration'] ?? 0,
            'play' => [
                'DataSize' => $best_video['DataSize'] ?? '',
                'Width' => $best_video['Width'] ?? 0,
                'Height' => $best_video['Height'] ?? 0,
                'Uri' => $best_video['Uri'] ?? '',
                'UrlList' => $best_video['UrlList'] ?? [],
                'UrlKey' => $best_video['UrlKey'] ?? '',
                'FileHash' => $best_video['FileHash'] ?? '',
                'FileCs' => $best_video['FileCs'] ?? '',
            ],
            'music_info' => [
                'id' => $post_data['music']['id'] ?? '',
                'title' => $post_data['music']['title'] ?? '',
                'playUrl' => $post_data['music']['playUrl'] ?? '',
                'cover' => $post_data['music']['coverLarge'] ?? '',
                'author' => $post_data['music']['authorName'] ?? '',
                'original' => $post_data['music']['original'] ?? false,
                'duration' => $post_data['music']['preciseDuration']['preciseDuration'] ?? 0,
            ],
            'create_time' => $post_data['createTime'] ?? '',
            'stats' => [
                'diggCount' => $post_data['stats']['diggCount'] ?? 0,
                'shareCount' => $post_data['stats']['shareCount'] ?? 0,
                'commentCount' => $post_data['stats']['commentCount'] ?? 0,
                'playCount' => $post_data['stats']['playCount'] ?? 0,
                'collectCount' => $post_data['stats']['collectCount'] ?? 0,
            ],
            'author' => [
                'id' => $post_data['author']['id'] ?? '',
                'uniqueId' => $post_data['author']['uniqueId'] ?? '',
                'nickname' => $post_data['author']['nickname'] ?? '',
                'avatarLarger' => $post_data['author']['avatarLarger'] ?? '',
                'signature' => $post_data['author']['signature'] ?? '',
                'verified' => $post_data['author']['verified'] ?? false,
            ],
            'diversificationLabels' => $post_data['diversificationLabels'] ?? [],
            'suggestedWords' => $post_data['suggestedWords'] ?? [],
            'contents' => format_contents($post_data['contents'] ?? [])
        ]
    ];
}

/**
 * Format contents và hashtags
 */
function format_contents($contents) {
    return array_map(function ($content) {
        return [
            'textExtra' => array_map(function ($textExtra) {
                return [
                    'hashtagName' => $textExtra['hashtagName'] ?? ''
                ];
            }, $content['textExtra'] ?? [])
        ];
    }, $contents);
}

/**
 * Lấy headers mặc định
 */
function get_default_headers() {
    return [
        'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language: vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding: gzip, deflate, br',
        'Connection: keep-alive',
        'Upgrade-Insecure-Requests: 1',
        'Sec-Fetch-Dest: document',
        'Sec-Fetch-Mode: navigate',
        'Sec-Fetch-Site: none',
        'Sec-Fetch-User: ?1',
        'Cache-Control: max-age=0'
    ];
}

// ==================== MAIN EXECUTION ====================

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

// Lấy URL từ request
$id_or_url = $_GET['url'] ?? $_POST['url'] ?? '';

if (empty($id_or_url)) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Vui lòng cung cấp URL video TikTok bằng cách thêm tham số "?url=" vào URL.',
        'example' => [
            'full_url' => '?url=https://www.tiktok.com/@username/video/1234567890',
            'short_url' => '?url=https://vt.tiktok.com/ZS23K2jtk/',
            'video_id' => '?url=7422250015885675783'
        ]
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    exit;
}

// Parse và trả về kết quả
$result = parse_tiktok_post($id_or_url);
echo json_encode($result, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
?>
