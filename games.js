// games.js
// Juegos culturales visuales para Mentes Pinoleras

// Utilidad para mostrar un modal de juego
function showGameModal(title, contentHtml) {
    let modal = document.getElementById('gameModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'gameModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content game-modal-content">
                <div class="modal-header">
                    <h3 id="gameModalTitle"></h3>
                    <button class="close-btn" id="closeGameModalBtn">&times;</button>
                </div>
                <div class="game-modal-body" id="gameModalBody"></div>
            </div>
        `;
        document.body.appendChild(modal);
        document.getElementById('closeGameModalBtn').onclick = closeGameModal;
        modal.addEventListener('click', function(e) {
            if (e.target === modal) closeGameModal();
        });
    }
    document.getElementById('gameModalTitle').textContent = title;
    document.getElementById('gameModalBody').innerHTML = contentHtml;
    modal.classList.remove('hidden');
}

function closeGameModal() {
    const modal = document.getElementById('gameModal');
    if (modal) modal.classList.add('hidden');
}

// Trivia Cultural
function startTrivia() {
    const questions = [
        {
            question: "¿Cuál es el plato típico más representativo de Nicaragua?",
            options: ["Nacatamal", "Pupusa", "Tamale", "Arepa"],
            correct: 0
        },
        {
            question: "¿En qué mes se celebra Santo Domingo de Guzmán?",
            options: ["Julio", "Agosto", "Septiembre", "Octubre"],
            correct: 1
        },
        {
            question: "¿Cómo se llama el perro místico de las leyendas nicaragüenses?",
            options: ["El Chupacabras", "El Cadejo", "La Llorona", "El Duende"],
            correct: 1
        }
    ];
    let current = 0;
    let score = 0;
    function renderQuestion() {
        if (current >= questions.length) {
            showGameModal('Trivia Cultural', `<div style='text-align:center'><h2>¡Trivia completada!</h2><p>Tu puntuación: <b>${score}/${questions.length}</b></p><button class='play-btn' onclick='closeGameModal()'>Cerrar</button></div>`);
            return;
        }
        const q = questions[current];
        let html = `<div class='trivia-question'><h4>${q.question}</h4><div class='trivia-options'>`;
        q.options.forEach((opt, i) => {
            html += `<button class='play-btn trivia-opt-btn' onclick='window.__answerTrivia(${i})'>${opt}</button>`;
        });
        html += `</div></div>`;
        showGameModal('Trivia Cultural', html);
    }
    window.__answerTrivia = function(idx) {
        const q = questions[current];
        if (idx === q.correct) {
            score++;
            showGameModal('¡Correcto!', `<div style='text-align:center'><p>¡Respuesta correcta!</p><button class='play-btn' onclick='window.__nextTrivia()'>Siguiente</button></div>`);
        } else {
            showGameModal('Incorrecto', `<div style='text-align:center'><p>La respuesta correcta era: <b>${q.options[q.correct]}</b></p><button class='play-btn' onclick='window.__nextTrivia()'>Siguiente</button></div>`);
        }
    };
    window.__nextTrivia = function() {
        current++;
        renderQuestion();
    };
    renderQuestion();
}

// Adivina la Tradición
function startGuessGame() {
    const traditions = [
        {
            description: "Celebración religiosa donde se honra a la Virgen María con altares decorados y se reparten dulces",
            answer: "La Purísima"
        },
        {
            description: "Danza folclórica donde los participantes llevan máscaras y representan la lucha entre el bien y el mal",
            answer: "El Güegüense"
        },
        {
            description: "Festividad donde se celebra al santo patrono de Managua con procesiones y bailes tradicionales",
            answer: "Santo Domingo de Guzmán"
        }
    ];
    const t = traditions[Math.floor(Math.random() * traditions.length)];
    let html = `<div class='guess-game'><p><b>Adivina la tradición:</b></p><blockquote>"${t.description}"</blockquote><input id='guessInput' type='text' placeholder='¿Qué tradición es?' class='form-group' style='width:100%;margin:1rem 0;'><div style='text-align:center'><button class='play-btn' onclick='window.__checkGuessGame()'>Comprobar</button></div><div id='guessResult'></div></div>`;
    showGameModal('Adivina la Tradición', html);
    // Función para normalizar texto (sin tildes, minúsculas, sin espacios extra)
    function normalize(str) {
        return str
            .toLowerCase()
            .normalize('NFD')
            .replace(/\p{Diacritic}/gu, '')
            .replace(/\s+/g, ' ')
            .trim();
    }
    window.__checkGuessGame = function() {
        const val = document.getElementById('guessInput').value;
        const resultDiv = document.getElementById('guessResult');
        if (normalize(val) === normalize(t.answer)) {
            resultDiv.innerHTML = `<p style='color:#10b981'><b>¡Correcto!</b> Conoces bien nuestras tradiciones.</p><button class='play-btn' onclick='closeGameModal()'>Cerrar</button>`;
        } else {
            resultDiv.innerHTML = `<p style='color:#ef4444'><b>Incorrecto.</b> La respuesta correcta era: <b>${t.answer}</b></p><button class='play-btn' onclick='closeGameModal()'>Cerrar</button>`;
        }
    };
}

// Mapa Cultural
function startMapGame() {
    const places = [
        "Granada - Ciudad colonial con arquitectura española",
        "León - Cuna de poetas y revolucionarios",
        "Masaya - Capital del folclore nicaragüense",
        "Ometepe - Isla formada por dos volcanes",
        "San Juan del Sur - Pueblo costero del Pacífico"
    ];
    let html = `<div class='map-game'><h4>Lugares históricos de Nicaragua:</h4><ul style='margin:1rem 0;'>`;
    places.forEach(p => {
        html += `<li style='margin-bottom:0.5rem;'>${p}</li>`;
    });
    html += `</ul><div style='text-align:center'><button class='play-btn' onclick='closeGameModal()'>Cerrar</button></div></div>`;
    showGameModal('Mapa Cultural', html);
}
