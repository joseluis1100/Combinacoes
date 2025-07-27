const selectN = document.getElementById("selectN")
const selectK = document.getElementById("selectK")
const selectKNotSel = document.getElementById("selectKNotSel")
const selectX = document.getElementById("selectX")
const grid = document.getElementById("buttonGrid")
const spreadsheetContainer = document.getElementById("spreadsheetContainer")

let selected = new Set()

function populateDropdown(select, max = 100) {
  select.innerHTML = ""
  for (let i = 1; i <= max; i++) {
    const opt = document.createElement("option")
    opt.value = i
    opt.textContent = i
    select.appendChild(opt)
  }
}

function validateDropdowns() {
  let n = parseInt(selectN.value)
  let k = parseInt(selectK.value)
  let kNotSel = parseInt(selectKNotSel.value)
  let x = parseInt(selectX.value)

  const errors = []

  if (n >= x) errors.push(`O valor de n (${n}) deve ser menor que x (${x}).`)
  if (k >= n) errors.push(`O valor de k (${k}) deve ser menor que n (${n}).`)
  if (kNotSel >= x - n)
    errors.push(
      `O valor de kNotSel (${kNotSel}) deve ser menor que x - n (${x - n}).`
    )

  // Exibir erros
  const errorDiv = document.getElementById("errorMessages")
  if (errors.length > 0) {
    errorDiv.innerHTML = errors.map((e) => `<p>${e}</p>`).join("")
    // Não atualizar valores nem gerar grid para evitar inconsistências
    return false
  } else {
    errorDiv.innerHTML = ""
  }

  // Se estiver tudo certo, ajusta os valores se necessário
  if (n >= x) n = x - 1
  if (k >= n) k = n - 1
  const notSelCount = x - n
  if (kNotSel >= notSelCount) kNotSel = Math.max(1, notSelCount - 1)

  selectN.value = n
  selectK.value = k
  selectKNotSel.value = kNotSel

  generateGrid(x)
  updateCombinationPreview()

  return true
}


function generateGrid(x) {
  grid.innerHTML = ""
  selected.clear()
  for (let i = 1; i <= x; i++) {
    const btn = document.createElement("button")
    btn.textContent = i
    btn.addEventListener("click", () => {
      const n = parseInt(selectN.value)
      if (btn.classList.contains("selected")) {
        btn.classList.remove("selected")
        selected.delete(i)
      } else {
        if (selected.size < n) {
          btn.classList.add("selected")
          selected.add(i)
        }
      }
    })
    grid.appendChild(btn)
  }
}

function getCombinationCount(n, k) {
  if (k > n || n < 0 || k < 0) return 0
  const factorial = (num) => (num <= 1 ? 1 : num * factorial(num - 1))
  return Math.round(factorial(n) / (factorial(k) * factorial(n - k)))
}

function updateCombinationPreview() {
  const n = parseInt(selectN.value)
  const k = parseInt(selectK.value)
  const kNotSel = parseInt(selectKNotSel.value)
  const x = parseInt(selectX.value)

  const totalSel = getCombinationCount(n, k)
  const notSel = x - n
  const totalNotSel = getCombinationCount(notSel, kNotSel)

  document.getElementById("preview").innerHTML = `
    Combinando ${n} números selecionados em grupos de ${k}: <strong>${totalSel.toLocaleString()}</strong> combinações possíveis.<br/>
    Combinando ${notSel} números não selecionados em grupos de ${kNotSel}: <strong>${totalNotSel.toLocaleString()}</strong> combinações possíveis.
  `
}

function getCombinations(arr, k) {
  let result = []
  function combine(temp = [], start = 0) {
    if (temp.length === k) {
      result.push([...temp])
      return
    }
    for (let i = start; i < arr.length; i++) {
      temp.push(arr[i])
      combine(temp, i + 1)
      temp.pop()
    }
  }
  combine()
  return result
}

function renderTable(dataSel, dataNotSel, selectedNums, allNums) {
  const notSel = allNums
    .filter((n) => !selectedNums.includes(n))
    .sort((a, b) => a - b)

  document.getElementById("summary").innerHTML = `
    <strong>Selecionados:</strong> ${selectedNums.join(", ")}<br/>
    <strong>Não selecionados:</strong> ${notSel.join(", ")}
  `

  const buildTable = (data) => {
    let html = "<table><thead><tr>"
    for (let i = 0; i < data[0].length; i++) {
      html += `<th>n${i + 1}</th>`
    }
    html += "<th>Soma</th></tr></thead><tbody>"
    data.forEach((row) => {
      const soma = row.reduce((a, b) => a + b, 0)
      html +=
        "<tr>" +
        row.map((n) => `<td>${n}</td>`).join("") +
        `<td>${soma}</td></tr>`
    })
    html += "</tbody></table>"
    return html
  }

  document.getElementById("tab-selected").innerHTML = buildTable(dataSel)
  document.getElementById("tab-notSelected").innerHTML = buildTable(dataNotSel)

  document.querySelectorAll(".tab-button").forEach((btn) => {
    btn.onclick = () => {
      document
        .querySelectorAll(".tab-button")
        .forEach((b) => b.classList.remove("active"))
      document
        .querySelectorAll(".tab-content")
        .forEach((c) => c.classList.remove("active"))
      btn.classList.add("active")
      document.getElementById(`tab-${btn.dataset.tab}`).classList.add("active")
    }
  })
}

document.getElementById("generate").addEventListener("click", () => {
  const n = parseInt(selectN.value)
  const k = parseInt(selectK.value)
  const kNotSel = parseInt(selectKNotSel.value)
  if (selected.size !== n) {
    alert(`Selecione exatamente ${n} números.`)
    return
  }
  const sorted = Array.from(selected).sort((a, b) => a - b)
  const all = Array.from({ length: parseInt(selectX.value) }, (_, i) => i + 1)
  const notSelected = all.filter((n) => !sorted.includes(n))
  const combinations = getCombinations(sorted, k)
  const combinationsNotSel = getCombinations(notSelected, kNotSel)
  renderTable(combinations, combinationsNotSel, sorted, all)
})

document.getElementById("random").addEventListener("click", () => {
  const n = parseInt(selectN.value)
  const k = parseInt(selectK.value)
  const kNotSel = parseInt(selectKNotSel.value)
  const x = parseInt(selectX.value)

  if (selected.size !== n) {
    alert(`Selecione exatamente ${n} números.`)
    return
  }

  const selectedArray = Array.from(selected).sort((a, b) => a - b)
  const notSelected = Array.from({ length: x }, (_, i) => i + 1).filter(
    (n) => !selectedArray.includes(n)
  )

  const combinationsSel = getCombinations(selectedArray, k)
  const combinationsNotSel = getCombinations(notSelected, kNotSel)

  if (combinationsSel.length === 0 || combinationsNotSel.length === 0) {
    alert("Não há combinações possíveis com os valores atuais.")
    return
  }

  const randomSel =
    combinationsSel[Math.floor(Math.random() * combinationsSel.length)]
  const randomNotSel =
    combinationsNotSel[Math.floor(Math.random() * combinationsNotSel.length)]

  document.getElementById("randomOutput").innerHTML = `
    <p><strong>Combinação aleatória dos selecionados:</strong> ${randomSel.join(
      ", "
    )}</p>
    <p><strong>Combinação aleatória dos não selecionados:</strong> ${randomNotSel.join(
      ", "
    )}</p>
  `
})

document.getElementById("export").addEventListener("click", () => {
  const n = parseInt(selectN.value)
  const k = parseInt(selectK.value)
  const kNotSel = parseInt(selectKNotSel.value)
  const all = Array.from({ length: parseInt(selectX.value) }, (_, i) => i + 1)
  const sorted = Array.from(selected).sort((a, b) => a - b)
  const notSelected = all
    .filter((n) => !sorted.includes(n))
    .sort((a, b) => a - b)

  const combSel = getCombinations(sorted, k)
  const combNotSel = getCombinations(notSelected, kNotSel)

  if (combSel.length === 0) {
    alert("Nenhuma combinação para exportar.")
    return
  }

  const wb = XLSX.utils.book_new()

  const combDataSel = combSel.map((row) => {
    const obj = {}
    row.forEach((val, i) => (obj[`n${i + 1}`] = val))
    obj["Soma"] = row.reduce((a, b) => a + b, 0)
    return obj
  })

  const combDataNotSel = combNotSel.map((row) => {
    const obj = {}
    row.forEach((val, i) => (obj[`n${i + 1}`] = val))
    obj["Soma"] = row.reduce((a, b) => a + b, 0)
    return obj
  })

  const sheetCombSel = XLSX.utils.json_to_sheet(combDataSel)
  const sheetCombNotSel = XLSX.utils.json_to_sheet(combDataNotSel)

  XLSX.utils.book_append_sheet(wb, sheetCombSel, "Combinações Selecionados")
  XLSX.utils.book_append_sheet(
    wb,
    sheetCombNotSel,
    "Combinações Não Selecionados"
  )

  const resumo = [
    ["Selecionados", ...sorted],
    ["Não selecionados", ...notSelected],
  ]
  const sheetResumo = XLSX.utils.aoa_to_sheet(resumo)
  XLSX.utils.book_append_sheet(wb, sheetResumo, "Resumo")

  XLSX.writeFile(wb, "combinacoes.xlsx")
})

// Inicialização
populateDropdown(selectN)
populateDropdown(selectK)
populateDropdown(selectKNotSel)
populateDropdown(selectX)

selectN.value = 15
selectK.value = 9
selectKNotSel.value = 6
selectX.value = 25

validateDropdowns()
updateCombinationPreview()
selectN.addEventListener("change", validateDropdowns)
selectK.addEventListener("change", validateDropdowns)
selectKNotSel.addEventListener("change", validateDropdowns)
selectX.addEventListener("change", validateDropdowns)

