// 全局变量
let words = [];
let currentWordIndex = 0;
let currentMode = 'auto';
let attemptCount = 0;
let maxAttempts = 3;
let results = [];
// 添加全局变量
let isMatchingGameActive = false;
let selectedTerm = null;
let matchedPairs = 0;
let totalPairs = 0;

// DOM 元素
const wordFileInput = document.getElementById('wordFile');
const modeSelect = document.getElementById('modeSelect');
const startBtn = document.getElementById('startBtn');
const wordArea = document.getElementById('wordArea');
const currentIndexSpan = document.getElementById('currentIndex');
const totalWordsSpan = document.getElementById('totalWords');
const promptDiv = document.getElementById('prompt');
const userAnswerInput = document.getElementById('userAnswer');
const checkBtn = document.getElementById('checkBtn');
const feedbackDiv = document.getElementById('feedback');
const nextBtn = document.getElementById('nextBtn');
const nextBtnContainer = document.getElementById('nextBtnContainer');
const resultsArea = document.getElementById('resultsArea');
const resultsSummary = document.getElementById('resultsSummary');
const downloadBtn = document.getElementById('downloadBtn');
const restartBtn = document.getElementById('restartBtn');

// 事件监听器
startBtn.addEventListener('click', startSession);
checkBtn.addEventListener('click', checkAnswer);
nextBtn.addEventListener('click', showNextWord);
downloadBtn.addEventListener('click', downloadResults);
restartBtn.addEventListener('click', resetApp);
userAnswerInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        checkAnswer();
    }
});

// 解析YAML文件
function parseYamlFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const yamlData = jsyaml.load(e.target.result);
                resolve(yamlData);
            } catch (error) {
                reject('YAML文件解析失败: ' + error.message);
            }
        };
        reader.onerror = function() {
            reject('无法读取文件');
        };
        reader.readAsText(file);
    });
}

// 开始背诵会话
// 在开始背诵会话函数中添加模式判断
// function startSession() {
//     const file = wordFileInput.files[0];
//     if (!file) {
//         alert('请先选择一个YAML词库文件');
//         return;
//     }
    
//     try {
//         words = await parseYamlFile(file);
//         currentMode = modeSelect.value;
        
//         // 如果选择了单词连连看模式
//         if (currentMode === 'matching') {
//             startWordMatchingGame();
//             return;
//         }
        
//         currentWordIndex = 0;
//         results = [];
        
//         // 开始计时
//         startTime = new Date();
        
//         // 显示词汇区域
//         wordArea.classList.remove('hidden');
//         resultsArea.classList.add('hidden');
        
//         totalWordsSpan.textContent = words.length;
//         showCurrentWord();
//     } catch (error) {
//         alert(error);
//     }
// }
async function startSession() {
    const file = wordFileInput.files[0];
    if (!file) {
        alert('请先选择一个YAML词库文件');
        return;
    }
    
    try {
        words = await parseYamlFile(file);
        currentMode = modeSelect.value;
        // 如果选择了单词连连看模式
        if (currentMode === 'matching') {
            startWordMatchingGame();
            return;
        }
        currentWordIndex = 0;
        results = [];
        
        startTime = new Date();
        // 显示词汇区域
        wordArea.classList.remove('hidden');
        resultsArea.classList.add('hidden');
        
        totalWordsSpan.textContent = words.length;
        showCurrentWord();
    } catch (error) {
        alert(error);
    }
}

// 显示当前单词
function showCurrentWord() {
    const word = words[currentWordIndex];
    currentIndexSpan.textContent = currentWordIndex + 1;
    
    // 重置状态
    attemptCount = 0;
    feedbackDiv.classList.add('hidden');
    nextBtnContainer.classList.add('hidden');
    userAnswerInput.value = '';
    userAnswerInput.disabled = false;
    checkBtn.disabled = false;
    
    // 根据模式决定提示内容
    let mode = currentMode;
    if (mode === 'auto') {
        // 随机选择模式 b, c 或 d
        const modes = ['chToEn', 'chToEnPartial', 'enToCh'];
        mode = modes[Math.floor(Math.random() * modes.length)];
    }
    
    switch (mode) {
        case 'chToEn': // 中译英(完整)
            promptDiv.innerHTML = `<strong>${word[1]}</strong>`;
            break;
        case 'chToEnPartial': // 中译英(部分)
            const englishWord = word[2];
            const partialHint = createPartialHint(englishWord);
            promptDiv.innerHTML = `<strong>${word[1]}</strong><br><span class="hint">${partialHint}</span>`;
            break;
        case 'enToCh': // 英译中
            promptDiv.innerHTML = `<strong>${word[2]}</strong>`;
            break;
    }
    
    // 保存当前模式用于答案检查
    promptDiv.dataset.mode = mode;
}

// 创建部分提示
function createPartialHint(word) {
    const wordLength = word.length;
    
    // 根据单词长度决定显示的字母数量
    // 长词显示更多提示，短词显示更少提示
    let hintCount;
    if (wordLength <= 3) {
        hintCount = 1; // 非常短的词只提示1个字母
    } else if (wordLength <= 6) {
        hintCount = Math.floor(Math.random() * 2) + 1; // 短词提示1-2个字母
    } else if (wordLength <= 10) {
        hintCount = Math.floor(Math.random() * 3) + 1; // 中等长度词提示1-3个字母
    } else {
        hintCount = Math.floor(Math.random() * 4) + 2; // 长词提示2-5个字母
    }
    
    // 确保提示数量不超过单词长度的一半
    hintCount = Math.min(hintCount, Math.ceil(wordLength / 2));
    
    // 创建单词的隐藏版本（所有字母用下划线替代）
    let hiddenWord = word.split('').map(() => '_').join('');
    
    // 随机选择位置显示字母
    const positions = [];
    while (positions.length < hintCount) {
        const pos = Math.floor(Math.random() * wordLength);
        if (!positions.includes(pos)) {
            positions.push(pos);
        }
    }
    
    // 在选定位置显示原始字母
    let hintWord = hiddenWord.split('');
    positions.forEach(pos => {
        hintWord[pos] = word[pos];
    });
    
    // 将提示词转换回字符串并添加总长度提示
    return hintWord.join(' ') + ` (${wordLength}字母)`;
}

// 检查答案
function checkAnswer() {
    const word = words[currentWordIndex];
    const userAnswer = userAnswerInput.value.trim();
    const mode = promptDiv.dataset.mode;
    
    let correct = false;
    let expectedAnswer = '';
    
    switch (mode) {
        case 'chToEn':
        case 'chToEnPartial':
            expectedAnswer = word[2];
            // 检查用户输入是否与英文单词匹配（忽略大小写）
            correct = userAnswer.toLowerCase() === expectedAnswer.toLowerCase();
            break;
        case 'enToCh':
            expectedAnswer = word[1];
            // 检查用户输入是否与中文释义匹配
            correct = userAnswer === expectedAnswer;
            break;
    }
    
    attemptCount++;
    
    if (correct) {
        // 答案正确
        feedbackDiv.textContent = `正确! 👏`;
        feedbackDiv.className = 'success';
        feedbackDiv.classList.remove('hidden');
        userAnswerInput.disabled = true;
        checkBtn.disabled = true;
        nextBtnContainer.classList.remove('hidden');
        
        // 记录结果
        results.push({
            index: word[0],
            chinese: word[1],
            english: word[2],
            attempts: attemptCount,
            success: true
        });
    } else {
        // 答案错误
        if (attemptCount < maxAttempts) {
            feedbackDiv.textContent = `答案不正确，还有 ${maxAttempts - attemptCount} 次机会。`;
            feedbackDiv.className = 'error';
            feedbackDiv.classList.remove('hidden');
        } else {
            // 三次都错了
            feedbackDiv.innerHTML = `正确答案是: <strong>${expectedAnswer}</strong>`;
            feedbackDiv.className = 'warning';
            feedbackDiv.classList.remove('hidden');
            userAnswerInput.disabled = true;
            checkBtn.disabled = true;
            nextBtnContainer.classList.remove('hidden');
            
            // 记录结果
            results.push({
                index: word[0],
                chinese: word[1],
                english: word[2],
                attempts: attemptCount,
                success: false
            });
        }
    }
}

// 显示下一个单词
function showNextWord() {
    currentWordIndex++;
    
    if (currentWordIndex < words.length) {
        showCurrentWord();
    } else {
        showResults();
    }
}

// 显示结果
function showResults() {
    // 结束计时
    endTime = new Date();
    const totalSeconds = Math.floor((endTime - startTime) / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    wordArea.classList.add('hidden');
    resultsArea.classList.remove('hidden');
    
    // 生成结果摘要
    let successCount = 0;
    let summaryHTML = '<h3>词汇练习结果:</h3><ul>';
    
    results.forEach(result => {
        if (result.success) successCount++;
        summaryHTML += `<li>${result.index}. ${result.chinese} (${result.english}) - ${result.success ? '正确' : '错误'} (${result.attempts}次尝试)</li>`;
    });
    
    summaryHTML += '</ul>';
    summaryHTML += `<p>总词汇数: ${results.length}, 正确: ${successCount}, 错误: ${results.length - successCount}</p>`;
    summaryHTML += `<p>正确率: ${(successCount / results.length * 100).toFixed(1)}%</p>`;
    summaryHTML += `<p>总用时: ${minutes}分${seconds}秒</p>`;
    
    resultsSummary.innerHTML = summaryHTML;
}

// 下载结果为TXT文件
function downloadResults() {
    let content = "背单词练习结果\n";
    content += "================\n\n";
    content += `日期: ${new Date().toLocaleString()}\n\n`;
    
    results.forEach(result => {
        content += `${result.index}. ${result.chinese} (${result.english}) - ${result.success ? '回答正确' : '回答错误'}, 第${result.success ? result.attempts : 'X'}次答对\n`;
    });
    
    content += "\n================\n";
    content += `总词汇数: ${results.length}\n`;
    let successCount = results.filter(r => r.success).length;
    content += `正确: ${successCount}, 错误: ${results.length - successCount}\n`;
    content += `正确率: ${(successCount / results.length * 100).toFixed(1)}%\n`;
    
    // 添加用时信息
    const totalSeconds = Math.floor((endTime - startTime) / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    content += `总用时: ${minutes}分${seconds}秒\n`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    a.href = url;
    a.download = `背单词结果_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// 重置应用
function resetApp() {
    currentWordIndex = 0;
    results = [];
    wordFileInput.value = '';
    modeSelect.value = 'auto';
    wordArea.classList.add('hidden');
    resultsArea.classList.add('hidden');
    startTime = null;
    endTime = null;
}

// 单词连连看游戏
function startWordMatchingGame() {
    isMatchingGameActive = true;
    
    // 隐藏标准单词区域，显示连连看区域
    wordArea.classList.add('hidden');
    resultsArea.classList.add('hidden');
    
    // 如果连连看区域不存在，创建它
    let matchingGameArea = document.getElementById('matchingGameArea');
    if (!matchingGameArea) {
        matchingGameArea = document.createElement('div');
        matchingGameArea.id = 'matchingGameArea';
        document.querySelector('.container').appendChild(matchingGameArea);
    }
    
    matchingGameArea.classList.remove('hidden');
    
    // 从词库中选择10个单词（或者少于10个如果词库不够大）
    const gameSize = Math.min(10, words.length);
    const gameWords = [];
    
    // 随机选择不重复的单词
    const wordIndices = new Set();
    while (wordIndices.size < gameSize) {
        const randomIndex = Math.floor(Math.random() * words.length);
        wordIndices.add(randomIndex);
    }
    
    // 构建游戏单词数组
    wordIndices.forEach(index => {
        gameWords.push(words[index]);
    });
    
    totalPairs = gameWords.length;
    matchedPairs = 0;
    
    // 准备中文和英文术语数组
    const chineseTerms = gameWords.map(w => ({ id: w[0], text: w[1], matched: false }));
    const englishTerms = gameWords.map(w => ({ id: w[0], text: w[2], matched: false }));
    
    // 随机排序两列
    shuffleArray(chineseTerms);
    shuffleArray(englishTerms);
    
    // 开始计时
    startTime = new Date();
    
    // 构建游戏UI
    let gameHTML = `
        <div class="matching-game-header">
            <h3>单词连连看</h3>
            <div class="matching-progress">已匹配: <span id="matchProgress">${matchedPairs}/${totalPairs}</span></div>
        </div>
        <div class="matching-game-container">
            <div class="term-column chinese-terms">
                ${chineseTerms.map(term => 
                    `<div class="term chinese-term" data-id="${term.id}" data-type="chinese">${term.text}</div>`
                ).join('')}
            </div>
            <div class="term-column english-terms">
                ${englishTerms.map(term => 
                    `<div class="term english-term" data-id="${term.id}" data-type="english">${term.text}</div>`
                ).join('')}
            </div>
        </div>
        <div class="matching-controls">
            <button id="matchingBackBtn">返回</button>
        </div>
    `;
    
    matchingGameArea.innerHTML = gameHTML;
    
    // 添加事件监听器
    document.querySelectorAll('.term').forEach(term => {
        term.addEventListener('click', handleTermClick);
    });
    
    document.getElementById('matchingBackBtn').addEventListener('click', () => {
        isMatchingGameActive = false;
        matchingGameArea.classList.add('hidden');
        resetApp();
    });
}

// 随机打乱数组顺序的辅助函数
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// 处理单词连连看中的点击事件
function handleTermClick(event) {
    if (!isMatchingGameActive) return;
    
    const clickedTerm = event.currentTarget;
    
    // 如果已经匹配过则忽略
    if (clickedTerm.classList.contains('matched')) {
        return;
    }
    
    // 如果是第一次选择
    if (!selectedTerm) {
        selectedTerm = clickedTerm;
        selectedTerm.classList.add('selected');
        return;
    }
    
    // 如果点击了已选中的元素，取消选择
    if (selectedTerm === clickedTerm) {
        selectedTerm.classList.remove('selected');
        selectedTerm = null;
        return;
    }
    
    // 检查是否是同一类型(中文或英文)
    if (selectedTerm.dataset.type === clickedTerm.dataset.type) {
        selectedTerm.classList.remove('selected');
        selectedTerm = clickedTerm;
        selectedTerm.classList.add('selected');
        return;
    }
    
    // 检查匹配是否正确
    if (selectedTerm.dataset.id === clickedTerm.dataset.id) {
        // 匹配成功
        selectedTerm.classList.remove('selected');
        selectedTerm.classList.add('matched');
        clickedTerm.classList.add('matched');
        
        // 播放成功动画
        animateMatchSuccess(selectedTerm, clickedTerm);
        
        selectedTerm = null;
        matchedPairs++;
        
        // 更新进度
        document.getElementById('matchProgress').textContent = `${matchedPairs}/${totalPairs}`;
        
        // 检查游戏是否完成
        if (matchedPairs === totalPairs) {
            setTimeout(() => {
                endMatchingGame();
            }, 1000);
        }
    } else {
        // 匹配失败
        const term1 = selectedTerm;
        const term2 = clickedTerm;
        
        term1.classList.add('error');
        term2.classList.add('error');
        
        setTimeout(() => {
            term1.classList.remove('selected', 'error');
            term2.classList.remove('error');
            selectedTerm = null;
        }, 1000);
    }
}

// 成功匹配动画
function animateMatchSuccess(term1, term2) {
    term1.classList.add('match-success');
    term2.classList.add('match-success');
    
    setTimeout(() => {
        term1.classList.remove('match-success');
        term2.classList.remove('match-success');
    }, 1000);
}

// 结束连连看游戏
function endMatchingGame() {
    // 结束计时
    endTime = new Date();
    const totalSeconds = Math.floor((endTime - startTime) / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    // 显示结果
    const matchingGameArea = document.getElementById('matchingGameArea');
    matchingGameArea.innerHTML = `
        <div class="matching-result">
            <h3>单词连连看完成!</h3>
            <p>总用时: ${minutes}分${seconds}秒</p>
            <p>匹配单词对数: ${totalPairs}</p>
            <div class="matching-controls">
                <button id="playAgainBtn">再玩一次</button>
                <button id="matchingBackBtn">返回主菜单</button>
            </div>
        </div>
    `;
    
    document.getElementById('playAgainBtn').addEventListener('click', startWordMatchingGame);
    document.getElementById('matchingBackBtn').addEventListener('click', () => {
        isMatchingGameActive = false;
        matchingGameArea.classList.add('hidden');
        resetApp();
    });
}

// 修改模式选择下拉框，添加单词连连看选项
// 在HTML中添加:
// <option value="matching">单词连连看</option>