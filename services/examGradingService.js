const EnglishExam = require("../models/EnglishExam");

/**
 * Service để chấm điểm tự động cho các loại câu hỏi khác nhau
 */
class ExamGradingService {
    /**
     * Chấm điểm câu trả lời dựa trên loại câu hỏi
     * @param {Object} question - Câu hỏi từ database
     * @param {*} userAnswer - Câu trả lời của user
     * @returns {Object} - Kết quả chấm điểm
     */
    static gradeAnswer(question, userAnswer) {
        const result = {
            isCorrect: false,
            scoreObtained: 0,
            feedback: "",
            maxScore: question.score_points || 1,
        };

        switch (question.question_type) {
            case "multiple_choice":
            case "reading_comprehension":
            case "listening_comprehension":
                result.isCorrect = userAnswer === question.correct_answer_id;
                result.feedback = result.isCorrect ? "Chính xác!" : `Câu trả lời đúng là: ${this.getOptionText(question.options, question.correct_answer_id)}`;
                break;

            case "fill_in_the_blank":
            case "rewrite_sentence":
                const correctAnswer = question.correct_answer_text?.toLowerCase().trim();
                const userAnswerText = userAnswer?.toLowerCase().trim();

                // Check exact match first
                result.isCorrect = userAnswerText === correctAnswer;

                // If not exact match, check similarity (optional)
                if (!result.isCorrect && correctAnswer && userAnswerText) {
                    const similarity = this.calculateSimilarity(userAnswerText, correctAnswer);
                    if (similarity > 0.8) {
                        // 80% similarity threshold
                        result.isCorrect = true;
                        result.feedback = "Gần đúng, được chấp nhận!";
                    }
                }

                if (!result.isCorrect) {
                    result.feedback = `Câu trả lời đúng: "${question.correct_answer_text}"`;
                }
                break;

            case "matching":
                result.isCorrect = this.compareMatching(userAnswer, question.correct_matches);
                result.feedback = result.isCorrect ? "Nối đúng tất cả!" : "Một số cặp nối chưa chính xác";
                break;

            case "rearrange_sentences":
                result.isCorrect = JSON.stringify(userAnswer) === JSON.stringify(question.correct_order_ids);
                result.feedback = result.isCorrect ? "Sắp xếp đúng thứ tự!" : "Thứ tự sắp xếp chưa chính xác";
                break;

            case "image_description":
                result.isCorrect = this.checkKeywords(userAnswer, question.correct_answer_keywords);
                const foundKeywords = this.getFoundKeywords(userAnswer, question.correct_answer_keywords);
                result.feedback = `Từ khóa tìm thấy: ${foundKeywords.join(", ")}`;
                break;

            default:
                // For subjective questions, return null to indicate manual grading needed
                result.isCorrect = null;
                result.feedback = "Câu hỏi này cần được chấm thủ công";
                break;
        }

        if (result.isCorrect === true) {
            result.scoreObtained = result.maxScore;
        } else if (result.isCorrect === null) {
            result.scoreObtained = 0; // Will be updated during manual grading
        }

        return result;
    }

    /**
     * Lấy text của option theo ID
     */
    static getOptionText(options, optionId) {
        const option = options?.find((opt) => opt.id === optionId);
        return option ? option.text : "Không xác định";
    }

    /**
     * Tính độ tương đồng giữa hai chuỗi (Levenshtein distance)
     */
    static calculateSimilarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;

        if (longer.length === 0) return 1.0;

        const distance = this.levenshteinDistance(longer, shorter);
        return (longer.length - distance) / longer.length;
    }

    /**
     * Tính khoảng cách Levenshtein
     */
    static levenshteinDistance(str1, str2) {
        const matrix = [];

        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }

        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
                }
            }
        }

        return matrix[str2.length][str1.length];
    }

    /**
     * So sánh câu trả lời matching
     */
    static compareMatching(userAnswer, correctMatches) {
        if (!userAnswer || !correctMatches) return false;

        // Convert to comparable format
        const userMatches = Array.isArray(userAnswer) ? userAnswer : [];
        const correctMatchesArray = Array.isArray(correctMatches) ? correctMatches : [];

        if (userMatches.length !== correctMatchesArray.length) return false;

        // Sort both arrays to compare
        const sortedUser = userMatches.sort((a, b) => a.left_id?.localeCompare(b.left_id));
        const sortedCorrect = correctMatchesArray.sort((a, b) => a.left_id?.localeCompare(b.left_id));

        return JSON.stringify(sortedUser) === JSON.stringify(sortedCorrect);
    }

    /**
     * Kiểm tra từ khóa trong câu trả lời mô tả hình ảnh
     */
    static checkKeywords(userAnswer, keywords) {
        if (!userAnswer || !keywords || keywords.length === 0) return false;

        const answerLower = userAnswer.toLowerCase();
        const foundKeywords = keywords.filter((keyword) => answerLower.includes(keyword.toLowerCase()));

        // Require at least 50% of keywords to be found
        return foundKeywords.length >= Math.ceil(keywords.length * 0.5);
    }

    /**
     * Lấy danh sách từ khóa được tìm thấy
     */
    static getFoundKeywords(userAnswer, keywords) {
        if (!userAnswer || !keywords) return [];

        const answerLower = userAnswer.toLowerCase();
        return keywords.filter((keyword) => answerLower.includes(keyword.toLowerCase()));
    }

    /**
     * Tính điểm tổng cho bài thi
     */
    static calculateTotalScore(gradingResults) {
        return gradingResults.reduce((total, result) => {
            return total + (result.scoreObtained || 0);
        }, 0);
    }

    /**
     * Tạo báo cáo chi tiết kết quả
     */
    static generateDetailedReport(exam, answers, gradingResults) {
        const report = {
            examInfo: {
                title: exam.exam_title,
                totalQuestions: exam.questions.length,
                totalPossibleScore: exam.total_score,
                difficulty: exam.difficulty_level,
            },
            performance: {
                totalScore: this.calculateTotalScore(gradingResults),
                percentage: 0,
                correctAnswers: 0,
                incorrectAnswers: 0,
                unanswered: 0,
            },
            questionBreakdown: [],
        };

        report.performance.percentage = Math.round((report.performance.totalScore / exam.total_score) * 100);

        exam.questions.forEach((question, index) => {
            const answer = answers.find((a) => a.question_id === question.question_id);
            const grading = gradingResults[index];

            if (!answer) {
                report.performance.unanswered++;
            } else if (grading?.isCorrect === true) {
                report.performance.correctAnswers++;
            } else if (grading?.isCorrect === false) {
                report.performance.incorrectAnswers++;
            }

            report.questionBreakdown.push({
                questionId: question.question_id,
                questionType: question.question_type,
                skillFocus: question.skill_focus,
                userAnswer: answer?.user_answer || null,
                isCorrect: grading?.isCorrect,
                scoreObtained: grading?.scoreObtained || 0,
                maxScore: grading?.maxScore || question.score_points,
                feedback: grading?.feedback || "",
            });
        });

        return report;
    }
}

module.exports = ExamGradingService;
