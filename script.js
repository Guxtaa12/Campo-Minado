document.addEventListener('DOMContentLoaded', () => {
    const gradeElemento = document.getElementById('grade-jogo');
    const minasRestantesElemento = document.getElementById('minas-restantes');
    const resetButton = document.getElementById('reset-button');

    const LARGURA = 10; // Largura da grade
    const ALTURA = 10;  // Altura da grade
    const NUM_MINAS = 15; // Número de minas

    let celulas = []; // Array para guardar o estado de cada célula
    let minasRestantes = NUM_MINAS;
    let bandeirasColocadas = 0;
    let jogoTerminado = false;
    let primeiraJogada = true; // Para garantir que a primeira jogada não seja uma mina

    // --- Criação e Inicialização do Jogo ---

    function criarGrade() {
        gradeElemento.innerHTML = ''; // Limpa a grade anterior
        gradeElemento.style.gridTemplateColumns = `repeat(${LARGURA}, 30px)`;
        gradeElemento.style.gridTemplateRows = `repeat(${ALTURA}, 30px)`;
        celulas = [];
        minasRestantes = NUM_MINAS;
        bandeirasColocadas = 0;
        jogoTerminado = false;
        primeiraJogada = true;
        minasRestantesElemento.textContent = minasRestantes;

        // 1. Cria a estrutura de dados das células
        for (let i = 0; i < ALTURA * LARGURA; i++) {
            celulas.push({
                id: i,
                eMina: false,
                eRevelada: false,
                eBandeira: false,
                minasVizinhas: 0,
                elemento: null // Referência ao DIV da célula
            });
        }

        // 2. Cria os elementos HTML (DIVs) para cada célula
        for (let i = 0; i < celulas.length; i++) {
            const celulaDiv = document.createElement('div');
            celulaDiv.classList.add('celula');
            celulaDiv.setAttribute('data-id', i); // Facilita identificar a célula no evento
            celulas[i].elemento = celulaDiv;

            // Adiciona ouvintes de evento
            celulaDiv.addEventListener('click', () => cliqueEsquerdo(celulas[i]));
            celulaDiv.addEventListener('contextmenu', (e) => {
                e.preventDefault(); // Impede o menu de contexto padrão
                cliqueDireito(celulas[i]);
            });

            gradeElemento.appendChild(celulaDiv);
        }
    }

    function posicionarMinas(primeiroCliqueId) {
       let minasPosicionadas = 0;
       while (minasPosicionadas < NUM_MINAS) {
            const randomIndex = Math.floor(Math.random() * celulas.length);
            // Garante que não coloque mina na célula do primeiro clique ou onde já existe uma
            if (randomIndex !== primeiroCliqueId && !celulas[randomIndex].eMina) {
                celulas[randomIndex].eMina = true;
                minasPosicionadas++;
            }
        }
    }

    function calcularMinasVizinhas() {
        for (let i = 0; i < celulas.length; i++) {
            if (celulas[i].eMina) continue; // Não calcula para minas

            let totalMinas = 0;
            const vizinhos = obterVizinhos(i);

            vizinhos.forEach(vizinhoId => {
                if (celulas[vizinhoId].eMina) {
                    totalMinas++;
                }
            });
            celulas[i].minasVizinhas = totalMinas;
        }
    }

    // Função auxiliar para obter os IDs das células vizinhas
    function obterVizinhos(id) {
        const vizinhos = [];
        const linha = Math.floor(id / LARGURA);
        const coluna = id % LARGURA;

        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i === 0 && j === 0) continue; // Pula a própria célula

                const vizinhoLinha = linha + i;
                const vizinhoColuna = coluna + j;

                // Verifica se o vizinho está dentro dos limites da grade
                if (vizinhoLinha >= 0 && vizinhoLinha < ALTURA &&
                    vizinhoColuna >= 0 && vizinhoColuna < LARGURA)
                {
                    const vizinhoId = vizinhoLinha * LARGURA + vizinhoColuna;
                    vizinhos.push(vizinhoId);
                }
            }
        }
        return vizinhos;
    }

    // --- Manipulação de Cliques ---

    function cliqueEsquerdo(celula) {
        if (jogoTerminado || celula.eRevelada || celula.eBandeira) return;

        // Lógica da primeira jogada segura
        if (primeiraJogada) {
            posicionarMinas(celula.id); // Posiciona minas *depois* do primeiro clique
            calcularMinasVizinhas();
            primeiraJogada = false;
             // Se a primeira célula clicada for uma mina após a distribuição, move-a
             if (celula.eMina) {
                moverMina(celula.id);
                calcularMinasVizinhas(); // Recalcula após mover
             }
        }

        if (celula.eMina) {
            gameOver(false); // Perdeu
            return;
        }

        revelarCelula(celula);
        verificarVitoria();
    }

    function cliqueDireito(celula) {
        if (jogoTerminado || celula.eRevelada) return;

        if (celula.eBandeira) {
            celula.eBandeira = false;
            celula.elemento.classList.remove('bandeira');
            bandeirasColocadas--;
        } else {
             // Só permite colocar bandeira se houver minas restantes (no contador)
             if (bandeirasColocadas < NUM_MINAS) {
                celula.eBandeira = true;
                celula.elemento.classList.add('bandeira');
                bandeirasColocadas++;
             }
        }
        minasRestantesElemento.textContent = NUM_MINAS - bandeirasColocadas;
    }

    // Função para mover uma mina se o primeiro clique for nela
    function moverMina(idMinaOriginal) {
        celulas[idMinaOriginal].eMina = false; // Remove a mina da posição original
        let novaPosicaoEncontrada = false;
        while (!novaPosicaoEncontrada) {
            const novoIndex = Math.floor(Math.random() * celulas.length);
            if (!celulas[novoIndex].eMina && novoIndex !== idMinaOriginal) {
                celulas[novoIndex].eMina = true;
                novaPosicaoEncontrada = true;
            }
        }
    }


    // --- Lógica de Revelação ---

    function revelarCelula(celula) {
        if (celula.eRevelada || celula.eBandeira) return; // Já tratada ou marcada

        celula.eRevelada = true;
        celula.elemento.classList.add('revelada');

        if (celula.minasVizinhas > 0) {
            celula.elemento.textContent = celula.minasVizinhas;
            celula.elemento.setAttribute('data-minas', celula.minasVizinhas); // Para o CSS colorir
        } else {
            // Se for 0, revela vizinhos recursivamente (expansão)
            const vizinhos = obterVizinhos(celula.id);
            vizinhos.forEach(vizinhoId => {
                // Pequeno delay para visualização (opcional)
                setTimeout(() => revelarCelula(celulas[vizinhoId]), 10);
            });
        }
    }

    // --- Fim de Jogo ---

    function gameOver(vitoria) {
        jogoTerminado = true;
        celulas.forEach(celula => {
            if (celula.eMina) {
                celula.elemento.classList.add('mina');
                if (!vitoria) { // Mostra todas as minas se perdeu
                    celula.elemento.classList.add('revelada'); // Revela para mostrar a mina
                    celula.elemento.textContent = '💣'; // Mostra a mina
                }
                 // Remove bandeira se houver e for mina
                 if (celula.eBandeira) celula.elemento.classList.remove('bandeira');

            } else if (celula.eBandeira && !vitoria) {
                 // Se marcou bandeira errada e perdeu, indica o erro
                 celula.elemento.textContent = '❌';
            }
             // Desativa cliques futuros (opcional, mas bom)
            celula.elemento.style.pointerEvents = 'none';
        });

        if (vitoria) {
            alert("Você Venceu! 🎉");
        } else {
            alert("Você Perdeu! 💣");
        }
    }

    function verificarVitoria() {
        let celulasSegurasReveladas = 0;
        celulas.forEach(celula => {
            if (!celula.eMina && celula.eRevelada) {
                celulasSegurasReveladas++;
            }
        });

        const totalCelulasSeguras = (LARGURA * ALTURA) - NUM_MINAS;
        if (celulasSegurasReveladas === totalCelulasSeguras) {
            gameOver(true); // Ganhou
        }
    }

    // --- Reiniciar ---
    resetButton.addEventListener('click', criarGrade);

    // --- Iniciar o jogo pela primeira vez ---
    criarGrade();
});