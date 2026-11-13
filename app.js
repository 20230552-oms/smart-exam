(function () {
  var EXAM_SIZE = 25;
  var PASS_SCORE = 18;
  var MARKS = ['①', '②', '③', '④'];

  var startScreen = document.getElementById('start-screen');
  var examScreen = document.getElementById('exam-screen');
  var progressEl = document.getElementById('progress');
  var questionArea = document.getElementById('question-area');
  var answerArea = document.getElementById('answer-area');
  var modal = document.getElementById('modal');
  var modalMessage = document.getElementById('modal-message');
  var modalResult = document.getElementById('modal-result');
  var modalOk = document.getElementById('modal-ok');

  var examQuestions = [];
  var responses = [];   // 문제별 응답: 객관식은 1~4, 단답형은 입력 문자열
  var current = 0;
  var inputs = [];      // 현재 화면의 입력 요소

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

  // 화면 가운데 알림창. result가 있으면 pass/fail을 크게 표시
  function showModal(message, result) {
    modalMessage.textContent = message;
    if (result) {
      modalResult.textContent = result;
      modalResult.className = 'modal-result ' + result;
      modalResult.hidden = false;
    } else {
      modalResult.hidden = true;
    }
    modal.hidden = false;
    modalOk.focus();
  }

  function closeModal() {
    modal.hidden = true;
  }

  function startExam() {
    examQuestions = pickRandom(window.QUESTIONS, EXAM_SIZE);
    responses = [];
    current = 0;
    startScreen.hidden = true;
    examScreen.hidden = false;
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
    if (q.type === 'choice') return response === q.answer;
    var given = normalize(response);
    return q.accepted.some(function (a) {
      return normalize(a) === given;
    });
  }

  function grade() {
    var correct = 0;
    examQuestions.forEach(function (q, i) {
      if (isCorrect(q, responses[i])) correct++;
    });
    showModal(
      examQuestions.length + '문제 중 ' + correct + '문제 정답',
      correct >= PASS_SCORE ? 'pass' : 'fail'
    );
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
    var response = readResponse();
    if (response === null) {
      showModal('답을 하지 않으면 모의고사가 진행되지 않아요');
      return;
    }
    responses[current] = response;

    if (current >= examQuestions.length - 1) {
      grade();
      return;
    }
    current++;
    renderQuestion();
  }

  document.getElementById('start-btn').addEventListener('click', startExam);
  document.getElementById('check-btn').addEventListener('click', showAnswer);
  document.getElementById('next-btn').addEventListener('click', nextQuestion);
  modalOk.addEventListener('click', closeModal);
  // [모의종료] 기능은 다음 단계에서 구현
})();
