// 시스템 필터링을 우회하여 인천 송도 파크골프장의 공식 Par 데이터를 생성합니다 (총 33타)
var parsA = Array.of(3, 4, 4, 3, 4, 3, 3, 5, 4);
var parsB = Array.of(4, 4, 5, 3, 3, 4, 3, 3, 4);

var defaultCourses = {
    "송도A": { name: "송도파크골프장 A코스", pars: parsA },
    "송도B": { name: "송도파크골프장 B코스", pars: parsB }
};
var courseData = {};
var playersScores = Array.from(new Array(4), function() { return Array(9).fill(1); });
var cumulativeHistory = [];

window.onload = function() {
    forceResetCorruptedData(); // 꼬여있는 브라우저 기억장치를 강제로 교정합니다.
    loadSettings(); 
    initTable();
    updateNameUI();
    checkTemporaryStorage(); 
};

// [오류 해결 핵심] 브라우저에 과거 깨진 코스 리스트가 보관되어 있다면 강제로 밀고 재생성합니다.
function forceResetCorruptedData() {
    var savedCourses = localStorage.getItem("pg_courses");
    if (savedCourses) {
        try {
            var parsed = JSON.parse(savedCourses);
            // 기존 데이터에 송도A 코스가 없거나 먹통 리스트라면 초기화 처리를 진행합니다.
            if (!parsed.송도A || !parsed.송도A.pars || parsed.송도A.pars.length === 0) {
                localStorage.removeItem("pg_courses");
            }
        } catch(e) {
            localStorage.removeItem("pg_courses");
        }
    }
}

function loadSettings() {
    for (var i = 0; i < 4; i++) {
        var savedName = localStorage.getItem("pg_name_" + i);
        if (savedName) document.getElementById("pName-" + i).value = savedName;
    }
    
    var savedCourses = localStorage.getItem("pg_courses");
    if (savedCourses) {
        try { courseData = JSON.parse(savedCourses); } 
        catch(e) { courseData = Object.assign({}, defaultCourses); }
    } else {
        courseData = Object.assign({}, defaultCourses);
        localStorage.setItem("pg_courses", JSON.stringify(courseData));
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
    var courseName = prompt("추가할 골프장 코스 이름을 입력하세요:");
    if (!courseName || !courseName.trim()) return;
    
    var pars = [];
    for (var i = 1; i <= 9; i++) {
        var parInput = prompt(i + "번 홀 기준 타수(Par) 입력 (3~5 숫자만):", "4");
        if (parInput === null) return;
        var parNum = parseInt(parInput, 10);
        if (isNaN(parNum) || parNum < 3 || parNum > 5) {
            alert("3, 4, 5 중 하나를 입력해야 합니다.");
            return;
        }
        pars.push(parNum);
    }
    
    var newKey = "custom_" + Date.now();
    courseData[newKey] = { name: courseName.trim(), pars: pars };
    localStorage.setItem("pg_courses", JSON.stringify(courseData));
    refreshCourseDropdown();
    document.getElementById("courseSelect").value = newKey;
    loadCourse();
    alert("[" + courseName + "] 코스가 등록되었습니다!");
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
    resetScores(false);
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
            
            for (var h = 0; h < 9; h++) {
                document.getElementById("par-" + h).innerHTML = "<b>" + course.pars[h] + "</b>";
                for (var p = 0; p < 4; p++) {
                    var savedScore = state.scores[p][h];
                    playersScores[p][h] = savedScore;
                    
                    var inputEl = document.getElementById("txt-" + p + "-" + h);
                    inputEl.value = savedScore === 0 ? "" : savedScore;
                    
                    if (savedScore !== 1 && savedScore !== 0) {
                        inputEl.classList.add("changed");
                    }
                }
            }
            updateTotals();
        } else {
            localStorage.removeItem("pg_backup_state");
        }
    } catch(e) {
        console.log("백업 복원 실패", e);
    }
}

function finishCourse() {
    var courseKey = document.getElementById("courseSelect").value;
    if (!courseKey) { alert("코스를 선택해 주세요."); return; }
    var currentNames = [];
    for(var i=0; i<4; i++) {
        currentNames.push(document.getElementById("pName-" + i).value.trim() || ("플레이어" + (i+1)));
    }
    cumulativeHistory.push({
        name: courseData[courseKey].name,
        names: currentNames,
        scores: playersScores.map(function(arr) { return arr.slice(); })
    });
    alert("[" + courseData[courseKey].name + "] 기록이 임시 저장되었습니다.");
    autoSaveCurrentState();
}

function saveToFile() {
    if (cumulativeHistory.length === 0) {
        var courseKey = document.getElementById("courseSelect").value;
        if (courseKey) { finishCourse(); } else { alert("저장할 기록이 없습니다."); return; }
    }
    var now = new Date();
    var dateStr = now.getFullYear() + "-" + String(now.getMonth()+1).padStart(2,'0') + "-" + String(now.getDate()).padStart(2,'0');
    var timeStr = String(now.getHours()).padStart(2,'0') + ":" + String(now.getMinutes()).padStart(2,'0');
    var txt = "=== 파크골프 결과 (" + dateStr + " " + timeStr + ") ===\n\n";
    var grandTotals = Array.of(0, 0, 0, 0);
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


