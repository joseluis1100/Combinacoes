// ==========================================
// 1. VARIÁVEIS GLOBAIS E NAVEGAÇÃO
// ==========================================
const TOTAL_NUMBERS = 25 // Padrão Lotofácil
let selected = new Set()
let globalExportData = [] // Salva os jogos para exportar para Excel

// NOVO: Armazena as dezenas selecionadas do concurso anterior
let numerosJogoAnterior = new Set()

// Navegação entre as Abas Principais
document.querySelectorAll(".main-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document
      .querySelectorAll(".main-tab")
      .forEach((t) => t.classList.remove("active"))
    tab.classList.add("active")

    document
      .querySelectorAll(".view-section")
      .forEach((view) => (view.style.display = "none"))
    const targetView = document.getElementById(tab.dataset.view)
    if (targetView) targetView.style.display = "block"
  })
})

// Navegação das Abas da Tabela de Resultados
document.querySelectorAll(".tab-button").forEach((button) => {
  button.addEventListener("click", () => {
    document
      .querySelectorAll(".tab-button")
      .forEach((btn) => btn.classList.remove("active"))
    button.classList.add("active")

    document
      .querySelectorAll(".tab-content")
      .forEach((content) => content.classList.remove("active"))
    const targetTab = document.getElementById(`tab-${button.dataset.tab}`)
    if (targetTab) targetTab.classList.add("active")
  })
})

// ==========================================
// LÓGICA DE INTERFACE: TOGGLES DOS FILTROS
// ==========================================
document.querySelectorAll(".toggle-filtro").forEach((toggle) => {
  toggle.addEventListener("change", function () {
    const bloco = this.closest(".filter-block")
    if (bloco) {
      if (this.checked) {
        bloco.classList.remove("filter-disabled")
      } else {
        bloco.classList.add("filter-disabled")
      }
    }
  })
})

// ==========================================
// 2. MODO COMBINAÇÕES (O CLÁSSICO)
// ==========================================
function initCombinacoesGrid() {
  const grid = document.getElementById("buttonGrid")
  if (!grid) return
  grid.innerHTML = ""

  for (let i = 1; i <= TOTAL_NUMBERS; i++) {
    const btn = document.createElement("button")
    btn.textContent = i
    btn.addEventListener("click", () => {
      if (selected.has(i)) {
        selected.delete(i)
        btn.classList.remove("selected")
      } else {
        selected.add(i)
        btn.classList.add("selected")
      }
      updatePreview()
    })
    grid.appendChild(btn)
  }
}

function populateSelects() {
  const selects = ["selectN", "selectK", "selectX", "selectKNotSel"]
  selects.forEach((id) => {
    const el = document.getElementById(id)
    if (!el) return
    el.innerHTML = ""
    for (let i = 1; i <= TOTAL_NUMBERS; i++) {
      const option = document.createElement("option")
      option.value = i
      option.textContent = i
      if (id === "selectN" && i === 18) option.selected = true
      if (id === "selectK" && i === 15) option.selected = true
      if (id === "selectX" && i === 10) option.selected = true
      if (id === "selectKNotSel" && i === 5) option.selected = true
      el.appendChild(option)
    }
  })
}

function updatePreview() {
  const preview = document.getElementById("preview")
  if (preview) {
    preview.textContent = `Números selecionados (${
      selected.size
    }): ${Array.from(selected)
      .sort((a, b) => a - b)
      .join(", ")}`
  }
}

document.getElementById("clearSelection")?.addEventListener("click", () => {
  selected.clear()
  document
    .querySelectorAll("#buttonGrid button")
    .forEach((btn) => btn.classList.remove("selected"))
  updatePreview()
})

document.getElementById("autoSelect")?.addEventListener("click", () => {
  const selectN = document.getElementById("selectN")
  if (!selectN) return
  const n = parseInt(selectN.value)

  selected.clear()
  document
    .querySelectorAll("#buttonGrid button")
    .forEach((btn) => btn.classList.remove("selected"))

  const numbers = Array.from({ length: TOTAL_NUMBERS }, (_, i) => i + 1)
  for (let i = numbers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[numbers[i], numbers[j]] = [numbers[j], numbers[i]]
  }

  for (let i = 0; i < n; i++) {
    selected.add(numbers[i])
    document
      .querySelectorAll("#buttonGrid button")
      [numbers[i] - 1].classList.add("selected")
  }
  updatePreview()
})

document.getElementById("generate")?.addEventListener("click", () => {
  const selectK = document.getElementById("selectK")
  if (!selectK) return
  const k = parseInt(selectK.value)
  const selectedArr = Array.from(selected).sort((a, b) => a - b)

  if (selectedArr.length < k) {
    alert(`Selecione pelo menos ${k} números para gerar combinações.`)
    return
  }

  const totalPossivel = calcCombinacoesMatematicas(selectedArr.length, k)
  if (totalPossivel > 100000) {
    alert(
      `⚠️ TRAVA DE SEGURANÇA: Isso geraria ${totalPossivel.toLocaleString(
        "pt-BR"
      )} combinações na memória e travaria a aba. Reduza as dezenas.`
    )
    return
  }

  const todasComb = getCombinations(selectedArr, k)
  const validadas = todasComb.filter((comb) => aplicarFiltroSimples(comb))

  if (validadas.length === 0) {
    alert("Nenhuma combinação passou nos filtros atuais.")
    return
  }

  renderTable(
    validadas,
    [],
    selectedArr,
    Array.from({ length: TOTAL_NUMBERS }, (_, i) => i + 1)
  )
  document.querySelector('.tab-button[data-tab="selected"]')?.click()
})

// ==========================================
// 3. MODO FECHAMENTO PROFISSIONAL
// ==========================================
let estadosMatriz = {}
for (let i = 1; i <= TOTAL_NUMBERS; i++) estadosMatriz[i] = 0

function inicializarMatrizFechamento() {
  const container = document.getElementById("matrizFechamento")
  if (!container) return
  container.innerHTML = ""

  for (let i = 1; i <= TOTAL_NUMBERS; i++) {
    const btn = document.createElement("button")
    btn.textContent = i.toString().padStart(2, "0")
    btn.classList.add("btn-estado-0")

    btn.addEventListener("click", () => {
      // Gatilho da Animação
      btn.classList.remove("btn-pop")
      void btn.offsetWidth // Força o navegador a reiniciar a animação
      btn.classList.add("btn-pop")

      // Lógica das cores
      estadosMatriz[i] = (estadosMatriz[i] + 1) % 3
      btn.classList.remove("btn-estado-0", "btn-estado-1", "btn-estado-2")

      if (estadosMatriz[i] === 1) {
        btn.classList.add("btn-estado-1") // Verde
      } else if (estadosMatriz[i] === 2) {
        btn.classList.add("btn-estado-2") // Azul
      } else {
        btn.classList.add("btn-estado-0") // Branco
      }

      atualizarStatusFechamento()
    })
    container.appendChild(btn)
  }
}

// =======================================================
// NOVO: MATRIZ DO JOGO ANTERIOR (DIREITA DOS FILTROS)
// =======================================================
function inicializarMatrizJogoAnterior() {
  const container = document.getElementById("matrizJogoAnterior")
  if (!container) return
  container.innerHTML = ""

  for (let i = 1; i <= TOTAL_NUMBERS; i++) {
    const btn = document.createElement("button")
    btn.textContent = i.toString().padStart(2, "0")
    btn.classList.add("btn-estado-0")

    btn.addEventListener("click", () => {
      // Gatilho da Animação
      btn.classList.remove("btn-pop")
      void btn.offsetWidth // Força o navegador a reiniciar a animação
      btn.classList.add("btn-pop")

      // Lógica de seleção
      if (numerosJogoAnterior.has(i)) {
        numerosJogoAnterior.delete(i)
        btn.classList.remove("btn-estado-1")
        btn.classList.add("btn-estado-0")
      } else {
        if (numerosJogoAnterior.size >= 15) {
          alert("Você já preencheu as 15 dezenas do concurso anterior!")
          return
        }
        numerosJogoAnterior.add(i)
        btn.classList.remove("btn-estado-0")
        btn.classList.add("btn-estado-1") // Verde
      }

      const contador = document.getElementById("contadorJogoAnterior")
      if (contador) contador.innerText = `${numerosJogoAnterior.size}/15`
    })
    container.appendChild(btn)
  }
}

function atualizarStatusFechamento() {
  const painelStatus = document.getElementById("statusFechamento")
  if (!painelStatus) return

  const k = parseInt(document.getElementById("dezJogo")?.value) || 15
  const garantia = parseInt(document.getElementById("garantia")?.value) || 14
  const condicao =
    parseInt(document.getElementById("condicaoAcerto")?.value) || 15

  let fixos = 0
  let verdes = 0
  for (let i = 1; i <= TOTAL_NUMBERS; i++) {
    if (estadosMatriz[i] === 2) fixos++
    else if (estadosMatriz[i] === 1) verdes++
  }

  const total = fixos + verdes

  if (total === 0) {
    painelStatus.innerHTML = "Selecione os números no grid abaixo para começar."
    painelStatus.style.background = "#e3f2fd"
    painelStatus.style.color = "#0d47a1"
    return
  }

  if (total < k) {
    painelStatus.innerHTML = `⚠️ Escolhidos: <strong>${total}</strong>. Faltam ${
      k - total
    } para formar 1 jogo base de ${k}.`
    painelStatus.style.background = "#fff9c4"
    painelStatus.style.color = "#f57f17"
    return
  }

  const chaveFechamento = `${total}-${k}-${garantia}-${condicao}`
  let badgeMatriz = ""

  if (typeof BANCO_MATRIZES !== "undefined") {
    let matrizEncontrada = null
    if (fixos === 0) {
      matrizEncontrada = BANCO_MATRIZES[chaveFechamento]
    } else {
      const novaGarantia = garantia - fixos
      const novaCondicao = condicao - fixos
      const vagasRestantes = k - fixos
      if (novaGarantia > 0 && novaCondicao > 0) {
        const chaveVariavel = `${verdes}-${vagasRestantes}-${novaGarantia}-${novaCondicao}`
        matrizEncontrada = BANCO_MATRIZES[chaveVariavel]
      }
    }

    if (matrizEncontrada) {
      const qtdJogosNaMatriz = matrizEncontrada.length
      badgeMatriz = `
        <div style="margin-top: 8px;">
          <span style="display: inline-block; background: #fef08a; color: #854d0e; padding: 4px 10px; border-radius: 6px; font-size: 13px; font-weight: 800; box-shadow: 0 2px 4px rgba(0,0,0,0.05); border: 1px solid #eab308;">
            ⚡ Matriz Otimizada Encontrada! (${qtdJogosNaMatriz} jogos)
          </span>
        </div>`
    }
  }

  painelStatus.innerHTML = `
    Fechamento Mágico: <strong>${total} - ${k} - ${garantia} - ${condicao}</strong><br>
    <small style="color: #475569; font-weight: 600;">Sorteados: ${fixos} Fixas (Azul) e ${verdes} Variáveis (Verde).</small>
    ${badgeMatriz}
  `
  painelStatus.style.background = "#dcfce7"
  painelStatus.style.color = "#166534"
}

// Filtros Visuais (Pares/Ímpares)
const sliderRatio = document.getElementById("sliderRatio")
const inputPares = document.getElementById("inputPares")
const inputImpares = document.getElementById("inputImpares")
const dezJogoInput = document.getElementById("dezJogo")

function sincronizarFiltroProporcao(origem) {
  if (!dezJogoInput || !sliderRatio || !inputPares || !inputImpares) return
  const k = parseInt(dezJogoInput.value)
  sliderRatio.max = k

  if (origem === "slider") {
    inputPares.value = sliderRatio.value
    inputImpares.value = k - parseInt(sliderRatio.value)
  } else if (origem === "pares") {
    let p = parseInt(inputPares.value)
    if (p > k) p = k
    if (p < 0) p = 0
    inputPares.value = p
    sliderRatio.value = p
    inputImpares.value = k - p
  } else if (origem === "impares") {
    let i = parseInt(inputImpares.value)
    if (i > k) i = k
    if (i < 0) i = 0
    inputImpares.value = i
    inputPares.value = k - i
    sliderRatio.value = k - i
  }
}

sliderRatio?.addEventListener("input", () =>
  sincronizarFiltroProporcao("slider")
)
inputPares?.addEventListener("input", () => sincronizarFiltroProporcao("pares"))
inputImpares?.addEventListener("input", () =>
  sincronizarFiltroProporcao("impares")
)
dezJogoInput?.addEventListener("change", () => {
  sincronizarFiltroProporcao("slider")
  atualizarStatusFechamento()
})

// NOVO: Sincronização do Slider de Repetidas do Jogo Anterior
const sliderRepetidas = document.getElementById("sliderRepetidas")
const inputRepetidas = document.getElementById("inputRepetidas")

function sincronizarFiltroRepetidas(origem) {
  if (!sliderRepetidas || !inputRepetidas) return
  if (origem === "slider") {
    inputRepetidas.value = sliderRepetidas.value
  } else {
    let val = parseInt(inputRepetidas.value) || 0
    if (val > 15) val = 15
    if (val < 0) val = 0
    inputRepetidas.value = val
    sliderRepetidas.value = val
  }
}

sliderRepetidas?.addEventListener("input", () =>
  sincronizarFiltroRepetidas("slider")
)
inputRepetidas?.addEventListener("input", () =>
  sincronizarFiltroRepetidas("input")
)

document
  .getElementById("garantia")
  ?.addEventListener("input", atualizarStatusFechamento)
document
  .getElementById("condicaoAcerto")
  ?.addEventListener("input", atualizarStatusFechamento)

// ========================================================
// BOTÃO AUTO SELECIONAR (16 a 20 Totais, 0 a 3 Fixas)
// ========================================================
document.getElementById("clearFechamento")?.addEventListener("click", () => {
  for (let i = 1; i <= TOTAL_NUMBERS; i++) estadosMatriz[i] = 0
  inicializarMatrizFechamento()
  atualizarStatusFechamento()
  document.getElementById("tab-selected").innerHTML = ""
  const btnExp = document.getElementById("exportFechamentoXLSX")
  if (btnExp) btnExp.style.display = "none"
})

document
  .getElementById("autoSelectFechamento")
  ?.addEventListener("click", () => {
    // 1. Limpa a seleção atual
    document.getElementById("clearFechamento")?.click()

    // 2. Mantém a SUA lógica de sorteio (Qtd total e Qtd de Fixos)
    const qtdTotal = Math.floor(Math.random() * 5) + 16
    const qtdFixos = Math.floor(Math.random() * 4)

    // 3. Mantém o SEU embaralhamento (Fisher-Yates)
    const numbers = Array.from({ length: TOTAL_NUMBERS }, (_, i) => i + 1)
    for (let i = numbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[numbers[i], numbers[j]] = [numbers[j], numbers[i]]
    }

    // 4. Aplica os estados na matriz de dados
    for (let i = 0; i < qtdFixos; i++) estadosMatriz[numbers[i]] = 2
    for (let i = qtdFixos; i < qtdTotal; i++) estadosMatriz[numbers[i]] = 1

    // 5. Aplica o visual e a animação na tela
    const botoes = document.getElementById("matrizFechamento").children
    for (let i = 0; i < TOTAL_NUMBERS; i++) {
      const num = i + 1
      const btn = botoes[i]

      // Limpa as classes de estado e a classe de animação
      btn.classList.remove(
        "btn-estado-0",
        "btn-estado-1",
        "btn-estado-2",
        "btn-pop"
      )

      // Remove qualquer transição inline antiga para não conflitar com o CSS
      btn.style.transition = ""
      btn.style.transform = ""

      // Força o navegador a reiniciar a animação CSS
      void btn.offsetWidth

      if (estadosMatriz[num] === 2) {
        btn.classList.add("btn-estado-2")
        btn.classList.add("btn-pop") // Dispara a animação (Azul)
      } else if (estadosMatriz[num] === 1) {
        btn.classList.add("btn-estado-1")
        btn.classList.add("btn-pop") // Dispara a animação (Verde)
      } else {
        btn.classList.add("btn-estado-0")
        // Os botões não sorteados não ganham a classe 'btn-pop', assim só os sorteados "pulam"
      }
    }

    atualizarStatusFechamento()
  })

// ==========================================
// 4. MOTOR DO FECHAMENTO E FILTROS FINAIS
// ==========================================
document
  .getElementById("gerarMatrizFechamento")
  ?.addEventListener("click", async () => {
    const btnGerar = document.getElementById("gerarMatrizFechamento")
    const k = parseInt(dezJogoInput?.value) || 15
    const garantia = parseInt(document.getElementById("garantia")?.value) || 14
    const condicao =
      parseInt(document.getElementById("condicaoAcerto")?.value) || 15

    let fixos = []
    let selecionados = []
    for (let i = 1; i <= TOTAL_NUMBERS; i++) {
      if (estadosMatriz[i] === 2) fixos.push(i)
      else if (estadosMatriz[i] === 1) selecionados.push(i)
    }

    const vagasRestantes = k - fixos.length
    const todosEscolhidos = [...fixos, ...selecionados].sort((a, b) => a - b)

    if (vagasRestantes < 0) {
      alert(
        `Você escolheu ${fixos.length} números fixos, mas o jogo só tem ${k} dezenas.`
      )
      return
    }
    if (selecionados.length < vagasRestantes) {
      alert(
        `Faltam dezenas variáveis! Precisa de mais ${
          vagasRestantes - selecionados.length
        }.`
      )
      return
    }

    const chaveFechamento = `${todosEscolhidos.length}-${k}-${garantia}-${condicao}`
    let jogosFinais = []
    let usouMatriz = false
    let chaveUsadaInfo = chaveFechamento

    if (typeof BANCO_MATRIZES !== "undefined") {
      if (fixos.length === 0) {
        const matrizPronta = aplicarMatrizPronta(
          todosEscolhidos,
          chaveFechamento
        )
        if (matrizPronta) {
          jogosFinais = matrizPronta
          usouMatriz = true
        }
      } else {
        const novaGarantia = garantia - fixos.length
        const novaCondicao = condicao - fixos.length

        if (novaGarantia > 0 && novaCondicao > 0) {
          const chaveVariavel = `${selecionados.length}-${vagasRestantes}-${novaGarantia}-${novaCondicao}`
          const matrizParaVariaveis = aplicarMatrizPronta(
            selecionados,
            chaveVariavel
          )

          if (matrizParaVariaveis) {
            jogosFinais = matrizParaVariaveis.map((jogoVariavel) => {
              return [...fixos, ...jogoVariavel].sort((a, b) => a - b)
            })
            usouMatriz = true
            chaveUsadaInfo = `${chaveFechamento} (Base extraída: ${chaveVariavel})`
          }
        }
      }
    }

    if (!usouMatriz) {
      const qtdCandidatos = calcCombinacoesMatematicas(
        selecionados.length,
        vagasRestantes
      )
      const qtdUniverso = calcCombinacoesMatematicas(
        todosEscolhidos.length,
        condicao
      )
      const complexidadeCalculo = qtdCandidatos * qtdUniverso

      if (complexidadeCalculo > 5000000) {
        alert(
          `⚠️ COMPLEXIDADE ALTA: Faria ${complexidadeCalculo.toLocaleString(
            "pt-BR"
          )} cálculos. Insira Matrizes no arquivo 'matrizes.js' ou use Dezenas Fixas (Azul).`
        )
        return
      }

      btnGerar.disabled = true
      btnGerar.style.backgroundColor = "#94a3b8"
      btnGerar.textContent = "⏳ Combinando..."
      await new Promise((r) => setTimeout(r, 50))

      const combinacoesVerdes = getCombinations(selecionados, vagasRestantes)
      const candidatosBrutos = combinacoesVerdes.map((comb) =>
        [...fixos, ...comb].sort((a, b) => a - b)
      )

      btnGerar.textContent = "⏳ Fechando (0%)..."
      jogosFinais = await aplicarFechamentoMatematicoAsync(
        candidatosBrutos,
        todosEscolhidos,
        garantia,
        condicao,
        (porcentagem) => {
          btnGerar.textContent = `⏳ Fechando (${porcentagem}%)...`
        }
      )
    }

    // --- LÓGICA DE FILTROS ATUALIZADA (MÍNIMO E MÁXIMO) ---
    const togglePares = document.getElementById("chkFiltroPares")?.checked
    const toggleSoma = document.getElementById("chkFiltroSoma")?.checked
    const toggleRepetidas =
      document.getElementById("chkFiltroRepetidas")?.checked

    const alvoPares =
      parseInt(document.getElementById("inputPares")?.value) || 0
    const minSum = parseInt(document.getElementById("fechMinSum")?.value) || 0
    const maxSum = parseInt(document.getElementById("fechMaxSum")?.value) || 999

    // Novas variáveis para o intervalo de repetidas do jogo anterior
    const minRepetidas = parseInt(document.getElementById("repMin")?.value) || 0
    const maxRepetidas =
      parseInt(document.getElementById("repMax")?.value) || 15

    // Validação: Ver se ativou repetidas mas não escolheu o jogo anterior
    if (toggleRepetidas && numerosJogoAnterior.size < 15) {
      const resposta = confirm(
        `⚠️ Você ativou o Filtro de Repetidas, mas escolheu apenas ${numerosJogoAnterior.size} números do jogo anterior (o ideal são 15). Deseja continuar filtrando assim mesmo?`
      )
      if (!confirmar) {
        resetarBotaoGerar(btnGerar)
        return
      }
    }

    const jogosValidosFiltrados = []

    for (let jogo of jogosFinais) {
      let passaPares = true
      let passaSoma = true
      let passaRepetidas = true

      if (togglePares) {
        let qtdPares = jogo.filter((num) => num % 2 === 0).length
        if (qtdPares !== alvoPares) passaPares = false
      }

      if (toggleSoma) {
        let soma = jogo.reduce((a, b) => a + b, 0)
        if (soma < minSum || soma > maxSum) passaSoma = false
      }

      if (toggleRepetidas) {
        let repetidas = jogo.filter((num) =>
          numerosJogoAnterior.has(num)
        ).length

        // --- NOVA LÓGICA DE INTERVALO ---
        if (repetidas < minRepetidas || repetidas > maxRepetidas) {
          passaRepetidas = false
        }
      }

      if (passaPares && passaSoma && passaRepetidas) {
        jogosValidosFiltrados.push(jogo)
      }
    }

    if (jogosValidosFiltrados.length === 0) {
      alert(
        "Nenhum jogo passou nos Filtros selecionados. Relaxe os intervalos de Soma ou de Repetidas."
      )
      resetarBotaoGerar(btnGerar)
      return
    }

    renderTable(
      jogosValidosFiltrados,
      [],
      todosEscolhidos,
      Array.from({ length: TOTAL_NUMBERS }, (_, i) => i + 1)
    )

    const mensagem = usouMatriz
      ? `⚡ Gerado via Matriz Pronta (${chaveUsadaInfo}). Total: ${jogosValidosFiltrados.length} jogos.`
      : `🔥 Calculado pelo Algoritmo com ${fixos.length} Fixas. Total: ${jogosValidosFiltrados.length} jogos.`

    const summary = document.getElementById("summary")
    if (summary)
      summary.innerHTML += `<br><span style="color: #ea580c; font-weight: bold;">${mensagem}</span>`

    document.querySelector('.tab-button[data-tab="selected"]')?.click()
    resetarBotaoGerar(btnGerar)

    const btnExport = document.getElementById("exportFechamentoXLSX")
    if (btnExport) btnExport.style.display = "inline-block"
  })

function resetarBotaoGerar(btn) {
  if (!btn) return
  btn.disabled = false
  btn.style.backgroundColor = ""
  btn.textContent = "Gerar Jogos do Fechamento"
}

// ==========================================
// 5. FUNÇÕES MATEMÁTICAS E AUXILIARES
// ==========================================
function calcCombinacoesMatematicas(n, k) {
  if (k < 0 || k > n) return 0
  if (k === 0 || k === n) return 1
  let c = 1
  for (let i = 1; i <= k; i++) c = (c * (n - i + 1)) / i
  return Math.round(c)
}

function getCombinations(array, k) {
  const results = []
  function backtrack(start, currentCombo) {
    if (currentCombo.length === k) {
      results.push([...currentCombo])
      return
    }
    for (let i = start; i < array.length; i++) {
      currentCombo.push(array[i])
      backtrack(i + 1, currentCombo)
      currentCombo.pop()
    }
  }
  backtrack(0, [])
  return results
}

function aplicarFiltroSimples(comb) {
  let minPares = parseInt(document.getElementById("minPares")?.value) || 0
  let maxPares = parseInt(document.getElementById("maxPares")?.value) || 15
  let minSum = parseInt(document.getElementById("minSum")?.value) || 0
  let maxSum = parseInt(document.getElementById("maxSum")?.value) || 999

  let pares = 0,
    soma = 0
  for (let num of comb) {
    if (num % 2 === 0) pares++
    soma += num
  }
  return (
    pares >= minPares && pares <= maxPares && soma >= minSum && soma <= maxSum
  )
}

function aplicarMatrizPronta(dezenasEscolhidas, chaveMatriz) {
  if (typeof BANCO_MATRIZES === "undefined") return null
  const molde = BANCO_MATRIZES[chaveMatriz]
  if (!molde) return null
  const jogosProntos = []
  for (let linha of molde) {
    let jogoTraduzido = linha.map((posicao) => dezenasEscolhidas[posicao - 1])
    jogosProntos.push(jogoTraduzido.sort((a, b) => a - b))
  }
  return jogosProntos
}

async function aplicarFechamentoMatematicoAsync(
  jogosCandidatos,
  dezenasEscolhidas,
  garantia,
  condicao,
  updateProgress
) {
  let universoSorteios = getCombinations(dezenasEscolhidas, condicao)
  const tamanhoJogo = jogosCandidatos.length > 0 ? jogosCandidatos[0].length : 0

  if (
    garantia > condicao ||
    garantia > tamanhoJogo ||
    jogosCandidatos.length === 0
  )
    return jogosCandidatos

  const jogosFechados = []
  let candidatos = [...jogosCandidatos].sort(() => Math.random() - 0.5)
  const totalUniversoInicial = universoSorteios.length
  let ciclos = 0

  while (universoSorteios.length > 0 && candidatos.length > 0) {
    let melhorBilhete = null
    let sorteiosCobertosPeloMelhor = []
    let maxCobertura = -1
    let indexMelhorBilhete = -1

    for (let i = 0; i < candidatos.length; i++) {
      const candidato = candidatos[i]
      const sorteiosQueEleCobre = []
      for (let j = 0; j < universoSorteios.length; j++) {
        const sorteio = universoSorteios[j]
        let acertos = 0
        for (let num of candidato) {
          if (sorteio.includes(num)) acertos++
        }
        if (acertos >= garantia) sorteiosQueEleCobre.push(j)
      }
      if (sorteiosQueEleCobre.length > maxCobertura) {
        maxCobertura = sorteiosQueEleCobre.length
        melhorBilhete = candidato
        sorteiosCobertosPeloMelhor = sorteiosQueEleCobre
        indexMelhorBilhete = i
      }
      if (maxCobertura > 30) break
    }

    if (!melhorBilhete) break
    jogosFechados.push(melhorBilhete)
    candidatos.splice(indexMelhorBilhete, 1)

    for (let i = sorteiosCobertosPeloMelhor.length - 1; i >= 0; i--) {
      universoSorteios.splice(sorteiosCobertosPeloMelhor[i], 1)
    }

    ciclos++
    if (ciclos % 3 === 0) {
      let progresso = Math.round(
        ((totalUniversoInicial - universoSorteios.length) /
          totalUniversoInicial) *
          100
      )
      updateProgress(progresso)
      await new Promise((r) => setTimeout(r, 0))
    }
  }
  return jogosFechados.sort((a, b) => a[0] - b[0])
}

// ==========================================
// 6. RENDERIZAÇÃO E EXPORTAÇÃO EXCEL
// ==========================================
function renderTable(selectedCombs, notSelectedCombs, selectedArr, allArr) {
  const summary = document.getElementById("summary")
  const tabSelected = document.getElementById("tab-selected")
  const tabNotSelected = document.getElementById("tab-notSelected")

  if (summary)
    summary.innerHTML = `<strong>Total de Jogos Gerados:</strong> ${selectedCombs.length}`
  globalExportData = selectedCombs

  function buildHTMLTable(combinations, highlightArr) {
    if (combinations.length === 0) return "<p>Nenhum jogo gerado.</p>"
    let html =
      '<div style="overflow-x: auto;"><table style="width: 100%; border-collapse: collapse; margin-top: 10px;"><thead><tr><th style="border: 1px solid #cbd5e1; padding: 10px; background: #f8fafc;">#</th>'
    const k = combinations[0].length
    for (let i = 1; i <= k; i++)
      html += `<th style="border: 1px solid #cbd5e1; padding: 10px; background: #f8fafc;">D${i}</th>`
    html +=
      '<th style="border: 1px solid #cbd5e1; padding: 10px; background: #e0f2fe;">Par</th><th style="border: 1px solid #cbd5e1; padding: 10px; background: #e0f2fe;">Ímp</th><th style="border: 1px solid #cbd5e1; padding: 10px; background: #fef08a;">Soma</th><th style="border: 1px solid #cbd5e1; padding: 10px; background: #fed7aa;">Repetidas</th></tr></thead><tbody>'

    combinations.forEach((comb, index) => {
      let pares = 0,
        soma = 0,
        repetidas = 0
      html += `<tr><td style="border: 1px solid #cbd5e1; padding: 10px; text-align: center; font-weight: bold; background: #f8fafc;">${
        index + 1
      }</td>`
      comb.forEach((num) => {
        if (num % 2 === 0) pares++
        soma += num
        if (numerosJogoAnterior.has(num)) repetidas++ // Conta repetição na visualização

        const isHighlight = highlightArr.includes(num)
        html += `<td style="border: 1px solid #cbd5e1; padding: 10px; text-align: center; ${
          isHighlight
            ? "background-color:#dcfce7; font-weight:bold; color:#166534;"
            : ""
        }">${num.toString().padStart(2, "0")}</td>`
      })
      html += `<td style="border: 1px solid #cbd5e1; padding: 10px; text-align: center; font-weight: 500;">${pares}</td><td style="border: 1px solid #cbd5e1; padding: 10px; text-align: center; font-weight: 500;">${
        k - pares
      }</td><td style="border: 1px solid #cbd5e1; padding: 10px; text-align: center; font-weight: 500;">${soma}</td><td style="border: 1px solid #cbd5e1; padding: 10px; text-align: center; font-weight: bold; color: #c2410c;">${repetidas}</td></tr>`
    })
    return html + "</tbody></table></div>"
  }

  function buildCartelasHTML(combinations) {
    if (combinations.length === 0) return ""
    let html =
      '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 20px; margin-top: 15px;">'

    combinations.forEach((comb, index) => {
      html += `<div style="border: 1px solid #cbd5e1; border-radius: 12px; padding: 15px; background: #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
                 <div style="font-weight: 800; font-size: 16px; margin-bottom: 15px; color: #0f172a; text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">🎫 Jogo ${
                   index + 1
                 }</div>
                 <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; justify-items: center;">`

      for (let i = 1; i <= 25; i++) {
        const isMarcado = comb.includes(i)
        const bg = isMarcado ? "#4caf50" : "#f1f5f9"
        const color = isMarcado ? "#ffffff" : "#94a3b8"
        const border = isMarcado ? "#2e7d32" : "#cbd5e1"
        const fw = isMarcado ? "800" : "500"
        const shadow = isMarcado ? "box-shadow: 0 2px 4px rgba(0,0,0,0.1);" : ""

        html += `<span style="display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 8px; background: ${bg}; color: ${color}; border: 1px solid ${border}; font-size: 15px; font-weight: ${fw}; ${shadow}">${i
          .toString()
          .padStart(2, "0")}</span>`
      }
      html += `  </div></div>`
    })
    html += "</div>"
    return html
  }

  function buildView(combinations, highlightArr, viewId) {
    if (combinations.length === 0) return "<p>Nenhum jogo gerado.</p>"
    return `
       <div style="display: flex; gap: 15px; margin-bottom: 20px; justify-content: center; background: #f8fafc; padding: 15px; border-radius: 10px; border: 1px solid #cbd5e1;">
         <button onclick="document.getElementById('table-view-${viewId}').style.display='block'; document.getElementById('grid-view-${viewId}').style.display='none';" style="padding: 12px 24px; cursor: pointer; border: none; border-radius: 8px; background: #2196F3; color: white; font-weight: 800; box-shadow: 0 4px 6px rgba(33, 150, 243, 0.2); transition: 0.2s;">📄 Ver Planilha</button>
         <button onclick="document.getElementById('table-view-${viewId}').style.display='none'; document.getElementById('grid-view-${viewId}').style.display='block';" style="padding: 12px 24px; cursor: pointer; border: none; border-radius: 8px; background: #4caf50; color: white; font-weight: 800; box-shadow: 0 4px 6px rgba(76, 175, 80, 0.2); transition: 0.2s;">🎟️ Ver Cartelas</button>
       </div>
       <div id="table-view-${viewId}" style="display: block;">${buildHTMLTable(
      combinations,
      highlightArr
    )}</div>
       <div id="grid-view-${viewId}" style="display: none;">${buildCartelasHTML(
      combinations
    )}</div>
     `
  }

  if (tabSelected)
    tabSelected.innerHTML = buildView(selectedCombs, selectedArr, "selected")
  if (tabNotSelected)
    tabNotSelected.innerHTML = buildView(
      notSelectedCombs,
      allArr,
      "notSelected"
    )
}

const acaoExportarXLSX = () => {
  if (globalExportData.length === 0) {
    alert("Nenhum jogo para exportar!")
    return
  }
  const worksheetData = globalExportData.map((jogo, i) => {
    let linha = { Jogo: i + 1 }
    let soma = 0
    let pares = 0
    let repetidas = 0
    jogo.forEach((num, colIndex) => {
      linha[`D${colIndex + 1}`] = num
      soma += num
      if (num % 2 === 0) pares++
      if (numerosJogoAnterior.has(num)) repetidas++
    })
    linha["Pares"] = pares
    linha["Ímpares"] = jogo.length - pares
    linha["Soma"] = soma
    linha["Repetidas_Ant"] = repetidas // Salva no Excel também
    return linha
  })
  const worksheet = XLSX.utils.json_to_sheet(worksheetData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Jogos Lotofácil")
  XLSX.writeFile(workbook, "Fechamento_Lotofacil.xlsx")
}

document
  .getElementById("exportFechamentoXLSX")
  ?.addEventListener("click", acaoExportarXLSX)
document.getElementById("export")?.addEventListener("click", acaoExportarXLSX)

// ==========================================
// INICIALIZAÇÃO
// ==========================================
window.onload = () => {
  initCombinacoesGrid()
  inicializarMatrizFechamento()
  inicializarMatrizJogoAnterior() // Inicia o grid novo
  populateSelects()
  atualizarStatusFechamento()
}
