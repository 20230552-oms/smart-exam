(function () {
  var EXAM_SIZE = 25;
  var PASS_SCORE = 18;
  var STORAGE_KEY = 'smartExamRecords';
  var MARKS = ['①', '②', '③', '④'];

  var startScreen = document.getElementById('start-screen');
  var examScreen = document.getElementById('exam-screen');
  var recordsScreen = document.getElementById('records-screen');
  var progressEl = document.getElementById('progress');
  var questionArea = document.getElementById('question-area');
  var answerArea = document.getElementById('answer-area');
  var recordsBody = document.getElementById('records-body');
  var recordsEmpty = document.getElementById('records-empty');
  var modal = document.getElementById('modal');
  var modalMessage = document.getElementById('modal-message');
  var modalResult = document.getElementById('modal-result');
  var modalOk = document.getElementById('modal-ok');
  var modalCancel = document.getElementById('modal-cancel');

  var examQuestions = [];
  var responses = [];   // 문제별 응답: 객관식은 1~4, 단답형은 입력 문자열
  var current = 0;
  var inputs = [];      // 현재 화면의 입력 요소
  var finished = false; // 채점·저장이 끝났는지
  var finalCorrect = 0; // 채점 결과 (저장한 값)
  var onModalOk = null;

  // 중복 없이 무작위로 n개 뽑기 (Fisher-Yates)
  function pickRandom(list, n) {
    var copy = list.slice();
    for (var i = copy.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy.slice(0, n);
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function showScreen(screen) {
    startScreen.hidden = screen !== startScreen;
    examScreen.hidden = screen !== examScreen;
    recordsScreen.hidden = screen !== recordsScreen;
  }

  // 화면 가운데 알림창
  // options.result: 'pass' 또는 'fail'을 크게 표시
  // options.onOk: 있으면 [확인] [취소]를 보여 주고, [확인]을 누를 때 실행
  function showModal(message, options) {
    options = options || {};
    modalMessage.textContent = message;
    if (options.result) {
      modalResult.textContent = options.result;
      modalResult.className = 'modal-result ' + options.result;
      modalResult.hidden = false;
    } else {
      modalResult.hidden = true;
    }
    onModalOk = options.onOk || null;
    modalCancel.hidden = !onModalOk;
    modal.hidden = false;
    modalOk.focus();
  }

  function closeModal() {
    modal.hidden = true;
  }

  function confirmModal() {
    var callback = onModalOk;
    onModalOk = null;
    closeModal();
    if (callback) callback();
  }

  // ----- 기록 -----

  function loadRecords() {
    try {
      var records = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return Array.isArray(records) ? records : [];
    } catch (e) {
      return [];
    }
  }

  function today() {
    var d = new Date();
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function saveRecord(correct) {
    var records = loadRecords();
    records.push({
      date: today(),
      round: records.length + 1,
      correct: correct,
      pass: correct >= PASS_SCORE
    });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch (e) {
      // 저장소를 쓸 수 없는 환경(사생활 보호 모드 등)에서도 채점 결과는 보여 준다
    }
  }

  function showRecords() {
    var records = loadRecords().slice().reverse(); // 최신 기록이 위
    recordsBody.innerHTML = '';
    records.forEach(function (r) {
      var tr = el('tr');
      tr.appendChild(el('td', '', r.date));
      tr.appendChild(el('td', '', String(r.round)));
      tr.appendChild(el('td', '', r.correct + '/' + EXAM_SIZE));
      tr.appendChild(el('td', r.pass ? 'pass' : 'fail', r.pass ? 'pass' : 'fail'));
      recordsBody.appendChild(tr);
    });
    recordsEmpty.hidden = records.length > 0;
    showScreen(recordsScreen);
  }

  // ----- 시험 -----

  function startExam() {
    examQuestions = pickRandom(window.QUESTIONS, EXAM_SIZE);
    responses = [];
    current = 0;
    finished = false;
    showScreen(examScreen);
    renderQuestion();
  }

  function renderQuestion() {
    var q = examQuestions[current];
    progressEl.textContent = (current + 1) + ' / ' + examQuestions.length;

    questionArea.innerHTML = '';
    answerArea.innerHTML = '';
    questionArea.scrollTop = 0;
    answerArea.scrollTop = 0;
    inputs = [];

    questionArea.appendChild(el('p', 'question-text', q.question));

    if (q.type === 'choice') {
      q.options.forEach(function (option, i) {
        var label = el('label', 'option');
        var input = document.createElement('input');
        input.type = 'radio';
        input.name = 'choice';
        input.value = String(i + 1);
        label.appendChild(input);
        label.appendChild(el('span', '', MARKS[i] + ' ' + option));
        questionArea.appendChild(label);
        inputs.push(input);
      });
    } else {
      var input = document.createElement('input');
      input.type = 'text';
      input.className = 'short-input';
      input.placeholder = '답을 입력하세요';
      input.autocomplete = 'off';
      questionArea.appendChild(input);
      inputs.push(input);
    }
  }

  // 현재 화면의 응답. 미응답이면 null (공백만 입력한 경우 포함)
  function readResponse() {
    var q = examQuestions[current];
    if (q.type === 'choice') {
      for (var i = 0; i < inputs.length; i++) {
        if (inputs[i].checked) return Number(inputs[i].value);
      }
      return null;
    }
    var text = inputs[0].value;
    return text.trim() ? text : null;
  }

  function normalize(text) {
    return String(text).replace(/\s+/g, '').toLowerCase();
  }

  function isCorrect(q, response) {
    if (response === null || response === undefined) return false; // 안 푼 문제는 오답
    if (q.type === 'choice') return response === q.answer;
    var given = normalize(response);
    return q.accepted.some(function (a) {
      return normalize(a) === given;
    });
  }

  function countCorrect() {
    var correct = 0;
    examQuestions.forEach(function (q, i) {
      if (isCorrect(q, responses[i])) correct++;
    });
    return correct;
  }

  // 채점하고 한 번만 저장
  function finishExam() {
    if (!finished) {
      finalCorrect = countCorrect();
      saveRecord(finalCorrect);
      finished = true;
    }
    return finalCorrect;
  }

  function showResult() {
    showModal(examQuestions.length + '문제 중 ' + finalCorrect + '문제 정답', {
      result: finalCorrect >= PASS_SCORE ? 'pass' : 'fail'
    });
  }

  function showAnswer() {
    var q = examQuestions[current];
    var answer = q.type === 'choice'
      ? MARKS[q.answer - 1] + ' ' + q.options[q.answer - 1]
      : q.answer;

    answerArea.innerHTML = '';
    answerArea.appendChild(el('p', 'answer-title', '정답'));
    answerArea.appendChild(el('p', 'answer-text', answer));
    if (q.explanation) {
      answerArea.appendChild(el('p', 'explanation-title', '해설'));
      answerArea.appendChild(el('p', 'explanation-text', q.explanation));
    }
  }

  function nextQuestion() {
    if (finished) { // 채점 후에는 답을 바꿔도 저장된 결과를 그대로 보여 준다
      showResult();
      return;
    }
    var response = readResponse();
    if (response === null) {
      showModal('답을 하지 않으면 모의고사가 진행되지 않아요');
      return;
    }
    responses[current] = response;

    if (current >= examQuestions.length - 1) {
      finishExam();
      showResult();
      return;
    }
    current++;
    renderQuestion();
  }

  function endExam() {
    if (finished) {
      showRecords();
      return;
    }
    showModal('지금 종료하면 안 푼 문제는 오답으로 기록됩니다', {
      onOk: function () {
        var response = readResponse(); // 현재 화면에서 고른 답도 포함
        if (response !== null) responses[current] = response;
        finishExam();
        showRecords();
      }
    });
  }

  document.getElementById('start-btn').addEventListener('click', startExam);
  document.getElementById('records-btn').addEventListener('click', showRecords);
  document.getElementById('restart-btn').addEventListener('click', startExam);
  document.getElementById('check-btn').addEventListener('click', showAnswer);
  document.getElementById('next-btn').addEventListener('click', nextQuestion);
  document.getElementById('end-btn').addEventListener('click', endExam);
  modalOk.addEventListener('click', confirmModal);
  modalCancel.addEventListener('click', closeModal);
})();
