// ===== KAIST API Configuration =====
// Cấu hình API cho Kaist AI Story Writer

const API_CONFIG = {
    // Đổi URL này thành backend của bạn
    BASE_URL: 'https://api.kaist.local/v1',
    TIMEOUT: 30000,
    HEADERS: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('kaist_token') || ''}`,
    }
};

/**
 * Gọi API tạo truyện mới
 * @param {string} prompt - Ý tưởng/prompt của người dùng
 * @param {string} genre - Thể loại (Fantasy, Ngôn tình, Kinh dị, Khoa huyễn)
 * @returns {Promise<string>} - Nội dung truyện được tạo
 */
async function generateStory(prompt, genre = 'Fantasy') {
    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/generate`, {
            method: 'POST',
            headers: API_CONFIG.HEADERS,
            body: JSON.stringify({
                prompt: prompt,
                genre: genre,
                model: 'gpt-4',
                max_tokens: 2000,
                temperature: 0.8
            }),
            signal: AbortSignal.timeout(API_CONFIG.TIMEOUT)
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        // Lưu vào lịch sử
        saveToHistory(prompt, data.story, genre);
        
        return data.story;
    } catch (error) {
        console.error('Generate Story Error:', error);
        return fallbackResponse(prompt, genre);
    }
}

/**
 * Tiếp tục câu chuyện
 * @param {string} storyId - ID của truyện
 * @param {string} lastContent - Nội dung truyện trước đó
 * @returns {Promise<string>} - Phần tiếp tục của truyện
 */
async function continueStory(storyId, lastContent) {
    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/continue`, {
            method: 'POST',
            headers: API_CONFIG.HEADERS,
            body: JSON.stringify({
                story_id: storyId,
                context: lastContent,
                max_tokens: 1500,
                temperature: 0.7
            }),
            signal: AbortSignal.timeout(API_CONFIG.TIMEOUT)
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        return data.continuation;
    } catch (error) {
        console.error('Continue Story Error:', error);
        return fallbackContinuation();
    }
}

/**
 * Lấy lịch sử truyện
 * @returns {Promise<Array>} - Danh sách các truyện gần đây
 */
async function getHistory() {
    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/history`, {
            method: 'GET',
            headers: API_CONFIG.HEADERS,
            signal: AbortSignal.timeout(API_CONFIG.TIMEOUT)
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        return data.stories || [];
    } catch (error) {
        console.error('Get History Error:', error);
        return loadLocalHistory();
    }
}

/**
 * Lưu vào lịch sử (local storage)
 */
function saveToHistory(prompt, story, genre) {
    const history = JSON.parse(localStorage.getItem('kaist_history') || '[]');
    history.unshift({
        id: Date.now(),
        prompt: prompt,
        story: story,
        genre: genre,
        timestamp: new Date().toISOString()
    });
    // Giữ tối đa 50 mục
    history.splice(50);
    localStorage.setItem('kaist_history', JSON.stringify(history));
}

/**
 * Tải lịch sử từ local storage
 */
function loadLocalHistory() {
    return JSON.parse(localStorage.getItem('kaist_history') || '[]');
}

/**
 * Response fallback khi API không khả dụng
 */
function fallbackResponse(prompt, genre) {
    const responses = {
        'Fantasy': `Trong một vương quốc xa xôi... ${prompt}\n\nMột hiệp sĩ dũng cảm bước vào cuộc phiêu lưu. Ánh mặt trời buổi sáng chiếu rọi trên những tảng đá cổ kính...`,
        'Ngôn tình': `Mưa rơi ngoài cửa sổ... ${prompt}\n\nAnh nhìn vào trong mắt cô với nụ cười đầy cảm xúc. Tình yêu không cần lời nói...`,
        'Kinh dị': `Bóng tối bao phủ mọi thứ... ${prompt}\n\nMột tiếng động lạ vang lên trong hdarkness. Cái gì đó đang đến gần...`,
        'Khoa huyễn': `Năm 2156, công nghệ đã thay đổi mọi thứ... ${prompt}\n\nRobot nhân tạo với trí thông minh vượt trội bắt đầu suy ngẫm về cuộc sống...`
    };
    
    return responses[genre] || responses['Fantasy'];
}

/**
 * Tiếp tục fallback
 */
function fallbackContinuation() {
    return "Câu chuyện tiếp tục... Những bước chân vang lên trên đất nước hoang dã. Tương lai không ai biết được, nhưng con tim luôn biết...";
}

// Export cho sử dụng trong HTML
window.KaistAPI = {
    generateStory,
    continueStory,
    getHistory,
    saveToHistory,
    loadLocalHistory
};
