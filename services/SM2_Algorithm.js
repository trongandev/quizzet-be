// Thuật toán SM-2 Spaced Repetition (tương tự như trong frontend)
function SM2_Algorithm(efactor, interval, petitions, quality) {
    let newEfactor = efactor;
    let newInterval = interval;
    let newRepetitions = petitions;

    if (quality >= 3) {
        if (newRepetitions === 0) {
            newInterval = 1;
        } else if (newRepetitions === 1) {
            newInterval = 6;
        } else {
            newInterval = Math.round(newInterval * newEfactor);
        }
        newRepetitions++;
    } else {
        newRepetitions = 0;
        newInterval = 1;
    }

    newEfactor = newEfactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (newEfactor < 1.3) {
        newEfactor = 1.3;
    }

    return { efactor: newEfactor, interval: newInterval, repetitions: newRepetitions };
}

/**
 * Hàm trợ giúp để tính phần trăm thuộc (percentage)
 * Có thể điều chỉnh logic này để phù hợp hơn với mong muốn của bạn
 * @param {number} quality - Điểm chất lượng cuối cùng
 * @param {number} efactor - Hệ số dễ dàng hiện tại
 * @returns {number} percentage (0-100)
 */
function calculatePercentage(quality, efactor) {
    // Ví dụ đơn giản: dựa trên chất lượng cuối cùng
    // Có thể phức tạp hơn dựa trên efactor hoặc repetitions
    return Math.round((quality / 5) * 100);
    // Hoặc dựa trên efactor: (efactor - 1.3) / (2.5 - 1.3) * 100
}

/**
 * Hàm trợ giúp để cập nhật trạng thái (status) của thẻ dựa trên SM-2 data
 * @param {Date} nextReviewDate
 * @param {number} efactor
 * @returns {string} status ('reviewing', 'remembered', 'learned')
 */
function determineCardStatus(nextReviewDate, efactor) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (nextReviewDate <= today) {
        return "reviewing"; // Đến hạn ôn tập
    } else if (efactor >= 2.7) {
        // Ngưỡng cho 'learned'
        return "learned";
    } else {
        return "remembered"; // Đã nhớ nhưng chưa đạt ngưỡng 'learned'
    }
}

module.exports = {
    SM2_Algorithm,
    determineCardStatus,
    calculatePercentage,
};
