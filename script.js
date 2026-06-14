var defaultCourses = {
    "송도A": { name: "송도파크골프장 A코스", pars: [3, 4, 4, 3, 4, 3, 3, 5, 4] },
    "송도B": { name: "송도파크골프장 B코스", pars: [4, 4, 5, 3, 3, 4, 3, 3, 4] }
};
var courseData = {};
var playersScores = Array.from(new Array(4), function() { return Array(9).fill(0); });
var cumulativeHistory = [];

window.onload = function() {
    loadSettings(); 
    initTable();
    updateNameUI();
};

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
                        "<td><button id='btn-0-" + h + "' class='score-btn' onclick='updateScore(0, " + h + ")'>-</button></td>" +
                        "<td><button id='btn-1-" + h + "' class='score-btn' onclick='updateScore(1, " + h + ")'>-</button></td>" +
                        "<td><button id='btn-2-" + h + "' class='score-btn' onclick='updateScore(2, " + h + ")'>-</button></td>" +
                        "<td><button id='btn-3-" + h + "' class='score-btn' onclick='updateScore(3, " + h + ")'>-</button></td>";
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
            playersScores[p][h] = course.pars[h];
            var btn = document.getElementById("btn-" + p + "-" + h);
            btn.innerText = course.pars[h];
            btn.classList.remove("changed");
        }
    }
    updateTotals();
}

function updateScore(p, h) {
    var courseKey = document.getElementById("courseSelect").value;
    if (!courseKey) { alert("코스를 선택해 주세요."); return; }
    var current = playersScores[p][h];
    var next = current >= 10 ? 1 : current + 1;
    playersScores[p][h] = next;
    var btn = document.getElementById("btn-" + p + "-" + h);
    btn.innerText = next;
    btn.classList.add("changed");
    updateTotals();
}

function updateTotals() {
    for (var p = 0; p < 4; p++) {
        var sum = playersScores[p].reduce(function(a, b) { return a + b; }, 0);
        document.getElementById("total-" + p).innerText = sum + "타";
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
    for (var p = 0; p < 4; p++) { txt += "▶ " + lastPlayerNames[p] + ": 총 " + grandTotals[p] + "타\n"; }
    txt += "============================================================\n";

    var blob = new Blob([txt], { type: "text/plain;charset=utf-8" });
    var link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "파크골프_결과_" + dateStr.replace(/-/g,'') + ".txt";
    link.click();
    cumulativeHistory = []; 
}

function resetScores(isFullReset) {
    if (isFullReset && !confirm("점수를 초기화하시겠습니까?")) return;
    playersScores = Array.from(new Array(4), function() { return Array(9).fill(0); });
    if(isFullReset) { document.getElementById("courseSelect").value = ""; cumulativeHistory = []; }
    for (var h = 0; h < 9; h++) {
        if(isFullReset) document.getElementById("par-" + h).innerText = "-";
        for (var p = 0; p < 4; p++) {
            var btn = document.getElementById("btn-" + p + "-" + h);
            btn.innerText = "-";
            btn.classList.remove("changed");
        }
    }
    updateTotals();
}
