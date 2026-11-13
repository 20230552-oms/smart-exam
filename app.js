(function () {
  var EXAM_SIZE = 25;
  var MARKS = ['①', '②', '③', '④'];

  var startScreen = document.getElementById('start-screen');
  var examScreen = document.getElementById('exam-screen');
  var progressEl = document.getElementById('progress');
  var questionArea = document.getElementById('question-area');
  var answerArea = document.getElementById('answer-area');
  var nextBtn = document.getElementById('next-btn');

  var examQuestions = [];
  var current = 0;

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

  function startExam() {
    examQuestions = pickRandom(window.QUESTIONS, EXAM_SIZE);
    current = 0;
    startScreen.hidden = true;
    examScreen.hidden = false;
    renderQuestion();
  }

  function renderQuestion() {
    var q = examQuestions[current];
    progressEl.textContent = (current + 1) + ' / ' + examQuestions.length;
    nextBtn.disabled = current >= examQuestions.length - 1;

    questionArea.innerHTML = '';
    answerArea.innerHTML = '';
    questionArea.scrollTop = 0;
    answerArea.scrollTop = 0;

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
      });
    } else {
      var input = document.createElement('input');
      input.type = 'text';
      input.className = 'short-input';
      input.placeholder = '답을 입력하세요';
      input.autocomplete = 'off';
      questionArea.appendChild(input);
    }
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
    if (current >= examQuestions.length - 1) return;
    current++;
    renderQuestion();
  }

  document.getElementById('start-btn').addEventListener('click', startExam);
  document.getElementById('check-btn').addEventListener('click', showAnswer);
  nextBtn.addEventListener('click', nextQuestion);
  // [모의종료] 기능은 다음 단계에서 구현
})();
