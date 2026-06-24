// 파크골프 4인 스코어 매니저 - JavaScript

// 송도 공식 코스 데이터
var parsA =;
var parsB =;
var parsC =;
var parsD =;
var parsE =;
var parsF =;

var defaultCourses = {
    "송도A": { name: "송도파크골프장 A코스", pars: parsA },
    "송도B": { name: "송도파크골프장 B코스", pars: parsB },
    "아시아드경기장 A코스": { name: "아시아드경기장 A코스", pars: parsC },
    "아시아드경기장 B코스": { name: "아시아드경기장 B코스", pars: parsD },
    "아시아드경기장 C코스": { name: "아시아드경기장 C코스", pars: parsE },
    "아시아드경기장 D코스": { name: "아시아드경기장 D코스", pars: parsF },
};

var courseData = {};
var playersScores = [[1,1,1,1,1,1,1,1,1], [1,1,1,1,1,1,1,1,1], [1,1,1,1,1,1,1,1,1], [1,1,1,1,1,1,1,1,1]];
var cumulativeHistory = [];

// 코스 추가용 임시 변수
var addingCourseName = "";
var addingCoursePars = [];
var currentParHole = 1;

window.onload = function() {
    // 앱을 켤 때마다 송도 코스를 새로 주입
    localStorage.removeItem("pg_courses");
    courseData = Object.assign({}, defaultCourses);
    localStorage.setItem("pg_courses", JSON.stringify(courseData));
    
    loadSettings(); 
    initTable();
    updateNameUI();
    checkTemporaryStorage(); 
};

function loadSettings() {
    for (var i = 0; i < 4; i++) {
        var savedName = localStorage.getItem("pg_name_" + i);
        if (savedName) document.getElementById("pName-" + i).value = savedName;
    }
    refreshCourseDropdown();
}

function saveSettings() {
    for (var i = 0; i < 4; i++) {
        var nameVal = document.getElementById("pName-" + i).value.trim() || ("플레이어" + (i+1));
        localStorage.setItem("pg_name_" + i, nameVal);
    }
    updateNameUI();
    autoSaveCurrentState();
}

function updateNameUI() {
    for (var i = 0; i < 4; i++) {
        var name = document.getElementById("pName-" + i).value.trim() || ("플레이어" + (i+1));
        document.getElementById("th-name-" + i).innerText = name;
        document.getElementById("tot-name-" + i).innerText = name;
    }
}

function refreshCourseDropdown() {
    var select = document.getElementById("courseSelect");
    select.innerHTML = '<option value="" disabled selected>코스를 선택하세요</option>';
    Object.keys(courseData).forEach(function(key) {
        var opt = document.createElement("option");
        opt.value = key;
        opt.innerText = courseData[key].name;
        select.appendChild(opt);
    });
}

function addNewCourse() {
    addingCourseName = "";
    addingCoursePars = [];
    currentParHole = 1;
    document.getElementById("courseNameInput").value = "";
    showModal("courseModal");
}

function closeModal() {
    document.getElementById("courseModal").style.display = "none";
    document.getElementById("parModal").style.display = "none";
}

function showModal(modalId) {
    document.getElementById(modalId).style.display = "flex";
}

function confirmCourseInput() {
    var name = document.getElementById("courseNameInput").value.trim();
    if (!name) {
        alert("코스 이름을 입력해주세요.");
        return;
    }
    addingCourseName = name;
    addingCoursePars = [];
    currentParHole = 1;
    document.getElementById("courseModal").style.display = "none";
    startParInput();
}

function startParInput() {
    if (currentParHole <= 9) {
        document.getElementById("parModalTitle").innerText = currentParHole + "번 홀 Par 입력";
        document.getElementById("parInput").value = "4";
        document.getElementById("parInput").focus();
        showModal("parModal");
    } else {
        finishCourseAdding();
    }
}

function confirmParInput() {
    var parInput = document.getElementById("parInput").value.trim();
    var parNum = parseInt(parInput, 10);
    
    if (isNaN(parNum) || parNum < 3 || parNum > 5) {
        alert("3, 4, 5 중 하나를 입력해주세요.");
        return;
    }
    
    addingCoursePars.push(parNum);
    currentParHole++;
    
    if (currentParHole <= 9) {
        startParInput();
    } else {
        finishCourseAdding();
    }
}

function cancelParInput() {
    if (confirm("코스 추가를 취소하시겠습니까?")) {
        closeModal();
        addingCourseName = "";
        addingCoursePars = [];
    } else {
        startParInput();
    }
}

function finishCourseAdding() {
    closeModal();
    var newKey = "custom_" + Date.now();
    courseData[newKey] = { name: addingCourseName, pars: addingCoursePars };
    localStorage.setItem("pg_courses", JSON.stringify(courseData));
    refreshCourseDropdown();
    document.getElementById("courseSelect").value = newKey;
    loadCourse();
    alert("[" + addingCourseName + "] 코스가 등록되었습니다!");
}

function initTable() {
    var tbody = document.getElementById("scoreBody");
    tbody.innerHTML = "";
    for (var h = 0; h < 9; h++) {
        var row = document.createElement("tr");
        row.innerHTML = "<td><b>" + (h + 1) + "</b></td><td id='par-" + h + "'>-</td>" +
                        "<td><input type='text' inputmode='numeric' pattern='[0-9]*' id='txt-0-" + h + "' class='score-input' value='-' oninput='onInputChange(0, " + h + ")' onclick='this.select()'></td>" +
                        "<td><input type='text' inputmode='numeric' pattern='[0-9]*' id='txt-1-" + h + "' class='score-input' value='-' oninput='onInputChange(1, " + h + ")' onclick='this.select()'></td>" +
                        "<td><input type='text' inputmode='numeric' pattern='[0-9]*' id='txt-2-" + h + "' class='score-input' value='-' oninput='onInputChange(2, " + h + ")' onclick='this.select()'></td>" +
                        "<td><input type='text' inputmode='numeric' pattern='[0-9]*' id='txt-3-" + h + "' class='score-input' value='-' oninput='onInputChange(3, " + h + ")' onclick='this.select()'></td>";
        tbody.appendChild(row);
    }
}

function loadCourse() {
    var courseKey = document.getElementById("courseSelect").value;
    if (!courseData[courseKey]) return;
    var course = courseData[courseKey];
    if (typeof resetScores === 'function') resetScores(false);
    for (var h = 0; h < 9; h++) {
        document.getElementById("par-" + h).innerHTML = "<b>" + course.pars[h] + "</b>";
        for (var p = 0; p < 4; p++) {
            playersScores[p][h] = 1; 
            var inputEl = document.getElementById("txt-" + p + "-" + h);
            inputEl.value = 1; 
            inputEl.classList.remove("changed");
        }
    }
    updateTotals();
    autoSaveCurrentState();
}

function onInputChange(p, h) {
    var courseKey = document.getElementById("courseSelect").value;
    if (!courseKey) {
        alert("먼저 코스를 선택해 주세요.");
        document.getElementById("txt-" + p + "-" + h).value = "-";
        return;
    }
    var inputEl = document.getElementById("txt-" + p + "-" + h);
    var val = inputEl.value.replace(/[^0-9]/g, ""); 
    
    if (val === "" || val === "0") {
        playersScores[p][h] = 0;
        inputEl.classList.remove("changed");
    } else {
        var num = parseInt(val, 10);
        if (num > 20) num = 20; 
        playersScores[p][h] = num;
        inputEl.value = num; 
        
        if (num !== 1) { inputEl.classList.add("changed"); } 
        else { inputEl.classList.remove("changed"); }
    }
    updateTotals();
    autoSaveCurrentState(); 
}

function updateTotals() {
    for (var p = 0; p < 4; p++) {
        var sum = playersScores[p].reduce(function(a, b) { return a + b; }, 0);
        document.getElementById("total-" + p).innerText = sum + "타";
    }
}

function autoSaveCurrentState() {
    var courseKey = document.getElementById("courseSelect").value;
    var state = {
        courseKey: courseKey,
        scores: playersScores,
        history: cumulativeHistory
    };
    localStorage.setItem("pg_backup_state", JSON.stringify(state));
}

function saveToFile() {
    if (cumulativeHistory.length === 0) {
        var courseKey = document.getElementById("courseSelect").value;
        if (courseKey) { 
            if (typeof finishCourse === 'function') finishCourse(); 
        } else { 
            alert("저장할 기록이 없습니다."); 
            return; 
        }
    }
    
    var now = new Date();
    var dateStr = now.getFullYear() + "-" + String(now.getMonth()+1).padStart(2,'0') + "-" + String(now.getDate()).padStart(2,'0');
    var timeStr = String(now.getHours()).padStart(2,'0') + ":" + String(now.getMinutes()).padStart(2,'0');
    
    var txt = "=== 파크골프 결과 (" + dateStr + " " + timeStr + ") ===\n\n";
    var grandTotals =; 
    var lastPlayerNames = cumulativeHistory[cumulativeHistory.length - 1].names;

    cumulativeHistory.forEach(function(history) {
        txt += "■ 코스: " + history.name + "\n------------------------------------------------------------\n";
        for (var p = 0; p < 4; p++) {
            var pScores = history.scores[p];
            var pSum = pScores.reduce(function(a, b) { return a + b; }, 0);
            grandTotals[p] += pSum;
            var scoreLine = pScores.map(function(s) { return String(s).padStart(2, ' '); }).join('   ');
            txt += history.names[p].padEnd(6, ' ') + "\t|  " + scoreLine + "  | " + pSum + "타\n";
        }
        txt += "------------------------------------------------------------\n\n";
    });
    txt += "============================================================\n★ 최종 종합 성적 ★\n";
    for (var p = 0; p < 4; p++) { 
        txt += "▶ " + lastPlayerNames[p] + ": 총 " + grandTotals[p] + "타\n"; 
    }
    txt += "============================================================\n";

    var filename = "파크골프_결과_" + dateStr.replace(/-/g,'') + ".txt";

    var blob = new Blob([txt], { type: "text/plain;charset=utf-8" });
    var link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    
    try {
        link.click();
        document.body.removeChild(link);
    } catch (e) {
        console.log("다운로드 실패");
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(txt).then(function() {
            alert("기록이 저장되었습니다.\n\n※ 파일이 안 보일 경우 결과 텍스트가 클립보드에 자동 복사되었으니 카카오톡이나 메모장에 바로 '붙여넣기' 하세요.");
        }).catch(function() {
            fallbackCopyToClipboard(txt);
        });
    } else {
        fallbackCopyToClipboard(txt);
    }
    
    cumulativeHistory = []; 
    localStorage.removeItem("pg_backup_state");
    if (typeof resetScores === 'function') resetScores(true);
}

function fallbackCopyToClipboard(text) {
    var textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
        document.execCommand('copy');
        alert("기록이 저장되었습니다.\n\n※ 파일이 안 보일 경우 메모장이나 카카오톡에 붙여넣기 하세요.");
    } catch (err) {
        alert("기록 복사에 실패했습니다.");
    }
    document.body.removeChild(textArea);
}

function checkTemporaryStorage() {
    var backup = localStorage.getItem("pg_backup_state");
    if (!backup) return;
    
    try {
        var state = JSON.parse(backup);
        if (!state.courseKey) return; 
        
        if (confirm("이전에 기록 중이던 라운딩 점수가 있습니다.\n그대로 불러와서 이어서 작성하시겠습니까?")) {
            cumulativeHistory = state.history || [];
            document.getElementById("courseSelect").value = state.courseKey;
            
            var course = courseData[state.courseKey];
            if (!course) return;

            playersScores = state.scores;
            for (var h = 0; h < 9; h++) {
                document.getElementById("par-" + h).innerHTML = "<b>" + course.pars[h] + "</b>";
                for (var p = 0; p < 4; p++) {
                    var inputEl = document.getElementById("txt-" + p + "-" + h);
                    var val = playersScores[p][h];
                    inputEl.value = val;
                    if (val !== 1) {
                        inputEl.classList.add("changed");
                    } else {
                        inputEl.classList.remove("changed");
                    }
                }
            }
            updateTotals();
        } else {
            localStorage.removeItem("pg_backup_state");
        }
    } catch (e) {
        console.error("백업 데이터 복구 실패", e);
    }
}
