// ── PREÇOS ──
const PRECOS = {
  afiac: 15,
  molinha: 5,
  "Mundial 777": 45,
  "Mundial 722": 60,
  "Mundial 775": 45,
  "Mundial 772": 70,
};
const MODELOS_VENDA = [
  "Mundial 777",
  "Mundial 722",
  "Mundial 775",
  "Mundial 772",
];

let CFG = {};
let DATA = { clientes: [], servicos: [], emprestimos: [], estoque: [] };
let tiposAtivos = { afiac: true, molinha: false, venda: false };
let modelosSelecionados = {}; // { modelo: qtd }

// ── CONFIG / LOGIN ──
function carregarConfig() {
  try {
    const s = localStorage.getItem("cris-cfg");
    if (s) {
      CFG = JSON.parse(s);
      CFG.token = "@F1acoes_by_Cr1s_1327x";
      CFG.url =
        "https://script.google.com/macros/s/AKfycbyDzqwixydlrZuhwerrOmztlBEX-7uc7WAK5p-PcoYaMFWhptvALKHsn2jmw7hj67P-/exec";
    }
  } catch (e) {}
}

function salvarConfig() {
  const url = document.getElementById("cfg-url").value.trim();
  const s1 = document.getElementById("cfg-senha").value;
  const s2 = document.getElementById("cfg-senha2").value;
  const err = document.getElementById("cfg-error");

  if (!url) return toast("Informe a URL do Apps Script", "red");
  if (!s1) return toast("Crie uma senha", "red");
  if (s1 !== s2) {
    err.style.display = "block";
    return;
  }

  err.style.display = "none";

  CFG = {
    url: "https://script.google.com/macros/s/AKfycbyDzqwixydlrZuhwerrOmztlBEX-7uc7WAK5p-PcoYaMFWhptvALKHsn2jmw7hj67P-/exec",
    senha: btoa(s1),
    token: "@F1acoes_by_Cr1s_1327x",
  };

  localStorage.setItem("cris-cfg", JSON.stringify(CFG));
  document.getElementById("config-screen").style.display = "none";
  iniciarApp();
}

function fazerLogin() {
  const s = document.getElementById("login-senha").value;
  const err = document.getElementById("login-error");
  if (!CFG.url) {
    document.getElementById("login-screen").style.display = "none";
    document.getElementById("config-screen").style.display = "flex";
    return;
  }
  if (btoa(s) === CFG.senha) {
    err.style.display = "none";
    document.getElementById("login-screen").style.display = "none";
    iniciarApp();
  } else {
    err.style.display = "block";
    document.getElementById("login-senha").value = "";
  }
}

function voltarLogin() {
  document.getElementById("config-screen").style.display = "none";
  document.getElementById("login-screen").style.display = "flex";
}

function logout() {
  if (!confirm("Sair do app?")) return;
  document.getElementById("app").style.display = "none";
  document.getElementById("login-screen").style.display = "flex";
  document.getElementById("login-senha").value = "";
}

// ── SYNC ──
function setSyncStatus(s) {
  const dot = document.getElementById("sync-dot");
  const txt = document.getElementById("sync-status");
  dot.className =
    "sync-dot" + (s === "syncing" ? " syncing" : s === "error" ? " error" : "");
  txt.textContent =
    s === "syncing" ? "salvando..." : s === "error" ? "erro" : "ok";
}

async function fetchData() {
  if (!CFG.url) return;

  try {
    const data = await apiGet();

    if (data.Clientes) {
      DATA.clientes = data.Clientes.map(normalizeCliente);
    }

    if (data.Servicos) {
      DATA.servicos = data.Servicos.map(normalizeServico);
    }

    if (data.Emprestimos) {
      DATA.emprestimos = data.Emprestimos.map(normalizeEmp);
    }

    if (data.Estoque) {
      DATA.estoque = data.Estoque.map(normalizeEstoque);
    }

    renderAll();
  } catch (err) {
    console.error(err);
  }
}

async function postData(payload) {
  return await apiPost(payload);
}

// ── NORMALIZE ──
function normalizeCliente(r) {
  return {
    id: str(r.id || r.ID),
    nome: str(r.nome || r.Nome),
    tel: str(r.tel || r.Tel),
    local: str(r.local || r.Local),
    obs: str(r.obs || r.Obs),
    data: str(r.data || r.Data),
  };
}
function normalizeServico(r) {
  const pagoRaw = String(r.pago || r.Pago || "false")
    .toLowerCase()
    .trim();
  const pago = pagoRaw === "true";
  return {
    id: str(r.id || r.ID),
    clienteNome: str(r.clienteNome || r.ClienteNome),
    tipo: str(r.tipo || r.Tipo),
    descricao: str(r.descricao || r.Descricao),
    valor: parseFloat(r.valor || r.Valor || 0),
    pagamento: str(r.pagamento || r.Pagamento),
    pago,
    data: str(r.data || r.Data),
    hora: str(r.hora || r.Hora),
    obs: str(r.obs || r.Obs),
  };
}
function normalizeEmp(r) {
  const devRaw =
    r.devolveu !== undefined
      ? r.devolveu
      : r.Devolveu !== undefined
        ? r.Devolveu
        : false;
  const devolveu = devRaw === true || String(devRaw).toLowerCase() === "true";
  return {
    id: str(r.id || r.ID),
    clienteNome: str(r.clienteNome || r.ClienteNome),
    modelo: str(r.modelo || r.Modelo),
    qtd: parseInt(r.qtd || r.Qtd || 1),
    obs: str(r.obs || r.Obs),
    data: str(r.data || r.Data),
    devolveu,
  };
}
function normalizeEstoque(r) {
  return {
    id: str(r.id || r.ID),
    modelo: str(r.modelo || r.Modelo),
    qtd: parseInt(r.qtd || r.Qtd || 0),
    custo: parseFloat(r.custo || r.Custo || 0),
    data: str(r.data || r.Data),
  };
}
function str(v) {
  return v === undefined || v === null ? "" : String(v);
}

function uid() {
  return Date.now() + Math.random().toString(36).slice(2, 6);
}
function hoje() {
  return new Date().toLocaleDateString("pt-BR");
}
function agora() {
  return new Date().toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
function fmt(v) {
  return "R$ " + v.toFixed(2).replace(".", ",");
}

// ── TIPO CHIPS (multi-seleção) ──

function toggleTipo(el) {
  const tipo = el.dataset.tipo;
  tiposAtivos[tipo] = !tiposAtivos[tipo];
  el.classList.toggle("active", tiposAtivos[tipo]);
  document.getElementById("bloco-" + tipo).style.display = tiposAtivos[tipo]
    ? "block"
    : "none";
  if (!tiposAtivos[tipo] && tipo !== "venda") {
    qtds[tipo] = 0;
    document.getElementById("qtd-" + tipo).textContent = "0";
  }
  if (!tiposAtivos[tipo] && tipo === "venda") {
    modelosSelecionados = {};
    document
      .querySelectorAll(".modelo-card")
      .forEach((c) => c.classList.remove("active"));
    atualizarModeloQtds();
  }
  calcularTotal();
}

// ── CONTADOR ──
let qtds = { afiac: 0, molinha: 0 };
function ajustarQtd(tipo, delta) {
  qtds[tipo] = Math.max(0, (qtds[tipo] || 0) + delta);
  document.getElementById("qtd-" + tipo).textContent = qtds[tipo];
  calcularTotal();
}

// ── MODELOS VENDA ──
function toggleModelo(el) {
  const m = el.dataset.modelo;
  if (modelosSelecionados[m]) {
    delete modelosSelecionados[m];
    el.classList.remove("active");
  } else {
    modelosSelecionados[m] = 1;
    el.classList.add("active");
  }
  atualizarModeloQtds();
  calcularTotal();
}

function atualizarModeloQtds() {
  const container = document.getElementById("qtds-modelo");
  const modelos = Object.keys(modelosSelecionados);
  if (!modelos.length) {
    container.innerHTML = "";
    return;
  }
  container.innerHTML = modelos
    .map(
      (m) => `
    <div class="qty-row">
      <span class="qty-label">${m}</span>
      <span class="qty-price">${fmt(PRECOS[m])} cada</span>
      <div class="counter" style="margin:0;width:120px;height:36px">
        <button class="counter-btn" style="height:36px;width:36px;font-size:18px" onclick="ajustarModeloQtd('${m}',-1)">−</button>
        <div class="counter-val" style="font-size:16px" id="mq-${m.replace(/ /g, "_")}">${modelosSelecionados[m]}</div>
        <button class="counter-btn" style="height:36px;width:36px;font-size:18px" onclick="ajustarModeloQtd('${m}',1)">+</button>
      </div>
    </div>`,
    )
    .join("");
}

function ajustarModeloQtd(modelo, delta) {
  modelosSelecionados[modelo] = Math.max(
    1,
    (modelosSelecionados[modelo] || 1) + delta,
  );
  document.getElementById("mq-" + modelo.replace(/ /g, "_")).textContent =
    modelosSelecionados[modelo];
  calcularTotal();
}

function calcularTotal() {
  let rows = [];
  let total = 0;

  if (tiposAtivos.afiac && qtds.afiac > 0) {
    const v = qtds.afiac * PRECOS.afiac;
    rows.push(
      `<div class="price-row"><span>${qtds.afiac}x Afiação</span><span>${fmt(v)}</span></div>`,
    );
    total += v;
  }
  if (tiposAtivos.molinha && qtds.molinha > 0) {
    const v = qtds.molinha * PRECOS.molinha;
    rows.push(
      `<div class="price-row"><span>${qtds.molinha}x Molinha</span><span>${fmt(v)}</span></div>`,
    );
    total += v;
  }
  if (tiposAtivos.venda) {
    Object.entries(modelosSelecionados).forEach(([m, q]) => {
      const v = q * PRECOS[m];
      rows.push(
        `<div class="price-row"><span>${q}x ${m}</span><span>${fmt(v)}</span></div>`,
      );
      total += v;
    });
  }

  document.getElementById("price-rows").innerHTML = rows.join("");
  document.getElementById("price-total").textContent = fmt(total);
}

function getServicoDescricao() {
  const partes = [];
  if (tiposAtivos.afiac && qtds.afiac > 0)
    partes.push(`${qtds.afiac}x Afiação`);
  if (tiposAtivos.molinha && qtds.molinha > 0)
    partes.push(`${qtds.molinha}x Molinha`);
  if (tiposAtivos.venda)
    Object.entries(modelosSelecionados).forEach(([m, q]) =>
      partes.push(`${q}x ${m}`),
    );
  return partes.join(", ");
}

function getServicoValor() {
  let total = 0;
  if (tiposAtivos.afiac) total += qtds.afiac * PRECOS.afiac;
  if (tiposAtivos.molinha) total += qtds.molinha * PRECOS.molinha;
  if (tiposAtivos.venda)
    total += Object.entries(modelosSelecionados).reduce(
      (s, [m, q]) => s + q * PRECOS[m],
      0,
    );
  return total;
}

// ── ADD SERVIÇO ──
async function addServico() {
  const cn = document.getElementById("s-cliente").value;
  if (!cn) return toast("Selecione a cliente", "red");

  const descricao = getServicoDescricao();
  if (!descricao) return toast("Selecione ao menos um serviço", "red");
  if (
    tiposAtivos.venda &&
    Object.keys(modelosSelecionados).length === 0 &&
    !tiposAtivos.afiac &&
    !tiposAtivos.molinha
  )
    return toast("Selecione ao menos um modelo", "red");

  const valor = getServicoValor();
  const pagamento = document.getElementById("s-pagamento").value;

  // Define tipo principal para categorização
  const tipos = [];
  if (tiposAtivos.afiac && qtds.afiac > 0) tipos.push("afiac");
  if (tiposAtivos.molinha && qtds.molinha > 0) tipos.push("molinha");
  if (tiposAtivos.venda && Object.keys(modelosSelecionados).length > 0)
    tipos.push("venda");
  const tipo = tipos.length === 1 ? tipos[0] : "misto";

  const s = {
    id: uid(),
    clienteNome: cn,
    tipo,
    descricao,
    valor,
    pagamento,
    pago: pagamento !== "A receber",
    data: hoje(),
    hora: agora(),
    obs: document.getElementById("s-obs").value.trim(),
  };
  DATA.servicos.push(s);

  // desconta estoque se tiver venda
  if (tiposAtivos.venda) {
    Object.entries(modelosSelecionados).forEach(([m, q]) => {
      const e = { id: uid(), modelo: m, qtd: -q, custo: 0, data: hoje() };
      DATA.estoque.push(e);
      postData({
        sheet: "Estoque",
        action: "append",
        headers: ["id", "modelo", "qtd", "custo", "data"],
        row: [e.id, e.modelo, e.qtd, e.custo, e.data],
      });
    });
  }

  renderAll();

  // reset form
  document.getElementById("s-obs").value = "";
  qtds = { afiac: 0, molinha: 0 };
  document.getElementById("qtd-afiac").textContent = "0";
  document.getElementById("qtd-molinha").textContent = "0";
  modelosSelecionados = {};
  document
    .querySelectorAll(".modelo-card")
    .forEach((c) => c.classList.remove("active"));
  atualizarModeloQtds();
  // volta chips para estado inicial (só afiação ativa)
  tiposAtivos = { afiac: true, molinha: false, venda: false };
  document.querySelectorAll("#tipo-chips .chip").forEach((c) => {
    c.classList.toggle("active", c.dataset.tipo === "afiac");
  });
  document.getElementById("bloco-afiac").style.display = "block";
  document.getElementById("bloco-molinha").style.display = "none";
  document.getElementById("bloco-venda").style.display = "none";
  calcularTotal();

  toast("Serviço registrado! " + fmt(valor), "pink");
  await postData({
    sheet: "Servicos",
    action: "append",
    headers: [
      "id",
      "clienteNome",
      "tipo",
      "descricao",
      "valor",
      "pagamento",
      "pago",
      "data",
      "hora",
      "obs",
    ],
    row: [
      s.id,
      s.clienteNome,
      s.tipo,
      s.descricao,
      s.valor,
      s.pagamento,
      s.pago,
      s.data,
      s.hora,
      s.obs,
    ],
  });
}

async function togglePago(id) {
  const s = DATA.servicos.find((s) => s.id === id);
  if (!s) return;
  s.pago = !s.pago;
  s.pagamento = s.pago ? "Pix" : "A receber";
  renderAll();
  toast(s.pago ? "Marcado como pago ✓" : "Desmarcado");
  await postData({
    sheet: "Servicos",
    action: "update",
    id,
    headers: [
      "id",
      "clienteNome",
      "tipo",
      "descricao",
      "valor",
      "pagamento",
      "pago",
      "data",
      "hora",
      "obs",
    ],
    row: [
      s.id,
      s.clienteNome,
      s.tipo,
      s.descricao,
      s.valor,
      s.pagamento,
      s.pago,
      s.data,
      s.hora,
      s.obs,
    ],
  });
}

async function addEmprestimo() {
  const cn = document.getElementById("e-cliente").value;
  const modelo = document.getElementById("e-modelo").value;
  if (!cn) return toast("Selecione a cliente", "red");
  if (!modelo) return toast("Selecione o modelo", "red");
  const e = {
    id: uid(),
    clienteNome: cn,
    modelo,
    qtd: parseInt(document.getElementById("e-qtd-emp").value) || 1,
    obs: document.getElementById("e-obs-emp").value.trim(),
    data: hoje(),
    devolveu: false,
  };
  DATA.emprestimos.push(e);
  renderAll();
  document.getElementById("e-obs-emp").value = "";
  toast("Empréstimo registrado");
  await postData({
    sheet: "Emprestimos",
    action: "append",
    headers: ["id", "clienteNome", "modelo", "qtd", "obs", "data", "devolveu"],
    row: [e.id, e.clienteNome, e.modelo, e.qtd, e.obs, e.data, e.devolveu],
  });
}

async function marcarDevolveu(id) {
  const e = DATA.emprestimos.find((e) => e.id === id);
  if (!e) return;
  e.devolveu = true;
  renderAll();
  toast("Alicate devolvido ✓");
  await postData({
    sheet: "Emprestimos",
    action: "update",
    id,
    headers: ["id", "clienteNome", "modelo", "qtd", "obs", "data", "devolveu"],
    row: [e.id, e.clienteNome, e.modelo, e.qtd, e.obs, e.data, e.devolveu],
  });
}

async function addCliente() {
  const nome = document.getElementById("c-nome").value.trim();
  if (!nome) return toast("Informe o nome", "red");
  const rua = document.getElementById("c-rua").value.trim();
  const numero = document.getElementById("c-numero").value.trim();
  const bairro = document.getElementById("c-bairro").value.trim();
  const cidade = document.getElementById("c-cidade").value.trim();
  const uf = document.getElementById("c-uf").value.trim();
  const complemento = document.getElementById("c-complemento").value.trim();
  const referencia = document.getElementById("c-referencia").value.trim();
  const cep = document.getElementById("c-cep").value.trim();
  // Monta endereço completo se preenchido
  let enderecoCompleto = "";
  if (rua) {
    enderecoCompleto =
      rua +
      (numero ? " " + numero : "") +
      (complemento ? " " + complemento : "") +
      (bairro ? " - " + bairro : "") +
      (cidade ? " - " + cidade : "") +
      (uf ? " / " + uf : "");
  }
  const localRapido = document.getElementById("c-local").value.trim();
  const local = enderecoCompleto || localRapido;
  const obsExtra = [referencia, cep ? "CEP: " + cep : ""]
    .filter(Boolean)
    .join(" | ");
  const obs =
    document.getElementById("c-obs").value.trim() +
    (obsExtra ? " | " + obsExtra : "");

  const c = {
    id: uid(),
    nome,
    tel: document.getElementById("c-tel").value.trim(),
    local,
    obs,
    data: hoje(),
  };
  DATA.clientes.push(c);
  renderAll();
  [
    "c-nome",
    "c-tel",
    "c-local",
    "c-obs",
    "c-cep",
    "c-rua",
    "c-numero",
    "c-bairro",
    "c-cidade",
    "c-uf",
    "c-complemento",
    "c-referencia",
    "c-cidade-uf",
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  document.getElementById("campos-endereco").style.display = "none";
  toast("Cliente salva! 💕", "pink");
  await postData({
    sheet: "Clientes",
    action: "append",
    headers: ["id", "nome", "tel", "local", "obs", "data"],
    row: [c.id, c.nome, c.tel, c.local, c.obs, c.data],
  });
}

async function addEstoque() {
  const modelo = document.getElementById("est-modelo").value;
  if (!modelo) return toast("Selecione o modelo", "red");
  const e = {
    id: uid(),
    modelo,
    qtd: parseInt(document.getElementById("est-qtd").value) || 1,
    custo: parseFloat(document.getElementById("est-custo").value) || 0,
    data: hoje(),
  };
  DATA.estoque.push(e);
  renderAll();
  document.getElementById("est-custo").value = "";
  document.getElementById("est-qtd").value = "1";
  toast("Entrada registrada");
  await postData({
    sheet: "Estoque",
    action: "append",
    headers: ["id", "modelo", "qtd", "custo", "data"],
    row: [e.id, e.modelo, e.qtd, e.custo, e.data],
  });
}

// ── RENDER ──
function renderAll() {
  renderInicio();
  renderServicos();
  renderClientes();
  renderEstoque();
  populateSelects();
  calcularTotal();
}

function renderInicio() {
  const h = hoje();
  const servicosHoje = DATA.servicos.filter((s) => s.data === h);
  const fat = servicosHoje.reduce((s, v) => s + (v.pago ? v.valor : 0), 0);
  const receber = DATA.servicos
    .filter((s) => !s.pago)
    .reduce((s, v) => s + v.valor, 0);
  const empAtivos = DATA.emprestimos.filter((e) => !e.devolveu);

  document.getElementById("m-faturamento").textContent = fmt(fat);
  document.getElementById("m-servicos-hoje").textContent =
    servicosHoje.length + " serviço(s) realizados";
  document.getElementById("m-receber").textContent = fmt(receber);
  document.getElementById("m-emprestados").textContent = empAtivos.length;

  const le = document.getElementById("lista-emprestados-home");
  if (!empAtivos.length) {
    le.innerHTML =
      '<div class="empty"><span class="empty-icon">📍</span>Nenhum alicate emprestado</div>';
  } else {
    le.innerHTML = empAtivos
      .map(
        (e) => `
      <div class="list-item">
        <div class="item-main">
          <div class="item-name">${e.clienteNome}</div>
          <div class="item-sub">${e.qtd}x ${e.modelo}</div>
          ${e.obs ? `<div class="item-tiny">${e.obs}</div>` : ""}
        </div>
        <div class="item-right">
          <span class="badge b-emprestado">emprestado</span><br>
          <div class="item-tiny" style="margin-top:4px">${e.data}</div>
          <button class="btn btn-green btn-sm" style="margin-top:6px" onclick="marcarDevolveu('${e.id}')">devolveu</button>
        </div>
      </div>`,
      )
      .join("");
  }

  const lp = document.getElementById("lista-pendencias");
  const pendentes = DATA.servicos.filter((s) => !s.pago);
  if (!pendentes.length) {
    lp.innerHTML =
      '<div class="empty"><span class="empty-icon">✅</span>Tudo em dia!</div>';
  } else {
    lp.innerHTML = pendentes
      .map(
        (s) => `
      <div class="list-item">
        <div class="item-main">
          <div class="item-name">${s.clienteNome}</div>
          <div class="item-sub">${s.descricao}</div>
          <div class="item-tiny">${s.data}</div>
        </div>
        <div class="item-right">
          <div class="item-value">${fmt(s.valor)}</div>
          <button class="toggle-btn" onclick="togglePago('${s.id}')">✓ recebido</button>
        </div>
      </div>`,
      )
      .join("");
  }
}

function renderServicos() {
  const el = document.getElementById("lista-servicos");
  if (!DATA.servicos.length) {
    el.innerHTML =
      '<div class="empty"><span class="empty-icon">✂️</span>Nenhum serviço ainda</div>';
    return;
  }
  el.innerHTML = [...DATA.servicos]
    .reverse()
    .map((s) => {
      const badgeClass =
        s.tipo === "afiac"
          ? "b-afiac"
          : s.tipo === "molinha"
            ? "b-afiac"
            : "b-venda";
      return `<div class="list-item">
      <div class="item-main">
        <div class="item-name">${s.clienteNome}</div>
        <div class="item-sub">${s.descricao}</div>
        ${s.obs ? `<div class="item-tiny">${s.obs}</div>` : ""}
        <div class="item-tiny">${s.data} ${s.hora} · ${s.pagamento}</div>
        <div class="item-actions">
          <button class="btn-edit" onclick="abrirEdicaoServico('${s.id}')">✏️ editar</button>
          <button class="btn-del" onclick="excluirServicoById('${s.id}')">🗑️ excluir</button>
        </div>
      </div>
      <div class="item-right">
        <div class="item-value">${fmt(s.valor)}</div>
        <span class="badge ${s.pago ? "b-pago" : "b-pendente"}">${s.pago ? "pago" : "pendente"}</span><br>
        <button class="toggle-btn" style="margin-top:6px" onclick="togglePago('${s.id}')">${s.pago ? "desfazer" : "✓ pago"}</button>
      </div>
    </div>`;
    })
    .join("");
}

function renderClientes(filtro) {
  const el = document.getElementById("lista-clientes");
  let lista = [...DATA.clientes].sort((a, b) =>
    a.nome.localeCompare(b.nome, "pt-BR"),
  );
  if (filtro)
    lista = lista.filter(
      (c) =>
        c.nome.toLowerCase().includes(filtro.toLowerCase()) ||
        (c.local || "").toLowerCase().includes(filtro.toLowerCase()),
    );
  if (!lista.length) {
    el.innerHTML =
      '<div class="empty"><span class="empty-icon">👥</span>Nenhuma cliente encontrada</div>';
    return;
  }
  el.innerHTML = lista
    .map((c) => {
      const nServ = DATA.servicos.filter(
        (s) => s.clienteNome === c.nome,
      ).length;
      const temEmp = DATA.emprestimos.find(
        (e) => e.clienteNome === c.nome && !e.devolveu,
      );
      const total = DATA.servicos
        .filter((s) => s.clienteNome === c.nome)
        .reduce((sum, s) => sum + s.valor, 0);
      const iniciais = c.nome
        .split(" ")
        .slice(0, 2)
        .map((p) => p[0])
        .join("")
        .toUpperCase();
      return `<div class="card" onclick="abrirCliente('${c.id}')" style="cursor:pointer">
      <div style="display:flex;align-items:center;gap:12px">
        <div class="avatar">${iniciais}</div>
        <div style="flex:1;min-width:0">
          <div style="font-weight:700;font-size:15px">${c.nome}</div>
          ${c.tel ? `<div style="font-size:13px;color:var(--text2)">${c.tel}</div>` : ""}
          ${c.local ? `<div style="font-size:12px;color:var(--text3)">${c.local}</div>` : ""}
        </div>
        <div style="text-align:right;flex-shrink:0">
          ${temEmp ? '<span class="badge b-emprestado" style="display:block;margin-bottom:4px">emprestado</span>' : ""}
          <span style="font-size:12px;color:var(--text3)">${nServ} serv.</span><br>
          <span style="font-size:12px;font-weight:700;color:var(--pink-dark)">${fmt(total)}</span>
        </div>
      </div>
    </div>`;
    })
    .join("");
}

function abrirCliente(id) {
  const c = DATA.clientes.find((c) => c.id === id);
  if (!c) return;
  const servicos = DATA.servicos.filter((s) => s.clienteNome === c.nome);
  const emprestimos = DATA.emprestimos.filter(
    (e) => e.clienteNome === c.nome && !e.devolveu,
  );
  const total = servicos.reduce((s, v) => s + v.valor, 0);
  const pendente = servicos
    .filter((s) => !s.pago)
    .reduce((s, v) => s + v.valor, 0);
  document.getElementById("modal-nome").textContent = c.nome;
  document.getElementById("modal-content").innerHTML = `
    ${c.tel ? `<div class="detail-row"><span class="detail-key">📱 Tel</span><span>${c.tel}</span></div>` : ""}
    ${c.local ? `<div class="detail-row"><span class="detail-key">📍 Local</span><span>${c.local}</span></div>` : ""}
    ${c.obs ? `<div class="detail-row"><span class="detail-key">📝 Obs</span><span>${c.obs}</span></div>` : ""}
    <div class="detail-row"><span class="detail-key">📅 Desde</span><span>${c.data}</span></div>
    <div class="detail-row"><span class="detail-key">💰 Total</span><span style="font-weight:800;color:var(--pink-dark)">${fmt(total)}</span></div>
    ${pendente > 0 ? `<div class="detail-row"><span class="detail-key">⏳ Pendente</span><span style="font-weight:700;color:var(--amber)">${fmt(pendente)}</span></div>` : ""}
    ${emprestimos.length ? `<div class="detail-row"><span class="detail-key">📍 Emprést.</span><span>${emprestimos.map((e) => e.qtd + "x " + e.modelo).join(", ")}</span></div>` : ""}
    ${
      servicos.length
        ? `<div style="margin-top:14px"><div class="card-title">Últimos serviços</div>${servicos
            .slice(-4)
            .reverse()
            .map(
              (s) =>
                `<div class="detail-row"><span class="detail-key">${s.data}</span><span>${s.descricao} · <strong>${fmt(s.valor)}</strong> · <span class="badge ${s.pago ? "b-pago" : "b-pendente"}">${s.pago ? "pago" : "pendente"}</span></span></div>`,
            )
            .join("")}</div>`
        : ""
    }
    <div class="modal-btn-row" style="margin-top:18px">
      <button class="btn btn-secondary" style="flex:1" onclick="fecharModal('modal-cliente');abrirEdicaoCliente('${c.id}')">✏️ Editar</button>
      <button class="btn btn-danger" style="flex:1" onclick="fecharModal('modal-cliente');confirmarExcluirCliente('${c.id}')">🗑️ Excluir</button>
    </div>
  `;
  document.getElementById("modal-cliente").classList.add("open");
}

function renderEstoque() {
  const resumo = document.getElementById("resumo-estoque");
  const lista = document.getElementById("lista-estoque");

  // calcula saldo por modelo (entradas positivas, saídas negativas)
  const saldo = {};
  DATA.estoque.forEach((e) => {
    saldo[e.modelo] = (saldo[e.modelo] || 0) + e.qtd;
  });

  if (!Object.keys(saldo).length) {
    resumo.innerHTML = '<div class="empty">Nenhum registro ainda</div>';
    lista.innerHTML = "";
    return;
  }

  resumo.innerHTML = Object.entries(saldo)
    .filter(([, q]) => q !== 0 || true)
    .map(([m, q]) => {
      const cls = q <= 0 ? "sn-zero" : q <= 2 ? "sn-low" : "sn-ok";
      const entradas = DATA.estoque
        .filter((e) => e.modelo === m && e.qtd > 0)
        .reduce((s, e) => s + e.qtd, 0);
      const saidas = DATA.estoque
        .filter((e) => e.modelo === m && e.qtd < 0)
        .reduce((s, e) => s + Math.abs(e.qtd), 0);
      return `<div class="stock-row">
      <div>
        <div class="stock-modelo">${m}</div>
        <div class="stock-sub">Entrou: ${entradas} · Vendido: ${saidas}</div>
      </div>
      <div style="text-align:right;display:flex;flex-direction:column;align-items:flex-end;gap:4px">
        <div class="stock-num ${cls}">${q}</div>
        <div style="font-size:11px;color:var(--text3)">em estoque</div>
        <button class="btn-edit" onclick="abrirAjusteEstoque('${m}',${q})">✏️ ajustar</button>
      </div>
    </div>`;
    })
    .join("");

  lista.innerHTML =
    [...DATA.estoque]
      .filter((e) => e.qtd > 0)
      .reverse()
      .map(
        (e) => `
    <div class="list-item">
      <div class="item-main">
        <div class="item-name">${e.modelo}</div>
        <div class="item-sub">${e.qtd} unid.${e.custo ? " · custo " + fmt(e.custo) : ""}</div>
      </div>
      <div class="item-right"><div class="item-tiny">${e.data}</div></div>
    </div>`,
      )
      .join("") || '<div class="empty">Nenhuma entrada</div>';
}

function populateSelects() {
  const nomes = DATA.clientes.map((c) => c.nome);
  ["s-cliente", "e-cliente"].forEach((id) => {
    const el = document.getElementById(id);
    const cur = el.value;
    el.innerHTML =
      `<option value="">Selecione...</option>` +
      nomes.map((n) => `<option value="${n}">${n}</option>`).join("");
    if (nomes.includes(cur)) el.value = cur;
  });
}

// ── PAGES ──
function showPage(name) {
  document
    .querySelectorAll(".page")
    .forEach((p) => p.classList.remove("active"));
  document
    .querySelectorAll(".tab")
    .forEach((t) => t.classList.remove("active"));
  document.getElementById("page-" + name).classList.add("active");
  const idx = ["inicio", "servicos", "clientes", "estoque"].indexOf(name);
  document.querySelectorAll(".tab")[idx].classList.add("active");
}

// ── MODAL ──
function fecharModal(id) {
  document.getElementById(id).classList.remove("open");
}

// ── TOAST ──
let toastTimer;
function toast(msg, tipo) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.className = "toast show" + (tipo ? " " + tipo : "");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2800);
}

// ── INIT ──
function iniciarApp() {
  document.getElementById("app").style.display = "flex";
  document.getElementById("app").style.flexDirection = "column";
  calcularTotal();
  fetchData();
}

// ── CEP ──
let cepTimer = null;
function formatarCEP(el) {
  const v = el.value.replace(/\D/g, "");
  clearTimeout(cepTimer);
  if (v.length === 8) {
    document.getElementById("cep-spinner").style.display = "inline";
    cepTimer = setTimeout(buscarCEP, 400);
  } else {
    document.getElementById("cep-spinner").style.display = "none";
    document.getElementById("campos-endereco").style.display = "none";
  }
}

async function buscarCEP() {
  const cep = document.getElementById("c-cep").value.replace(/\D/g, "");
  if (cep.length !== 8) return;
  try {
    const r = await fetch("https://viacep.com.br/ws/" + cep + "/json/");
    const d = await r.json();
    document.getElementById("cep-spinner").style.display = "none";
    if (d.erro) {
      toast("CEP não encontrado", "red");
      return;
    }
    document.getElementById("c-rua").value = d.logradouro || "";
    document.getElementById("c-bairro").value = d.bairro || "";
    document.getElementById("c-cidade").value = d.localidade || "";
    document.getElementById("c-uf").value = d.uf || "";
    document.getElementById("c-cidade-uf").value =
      (d.localidade || "") + (d.uf ? " / " + d.uf : "");
    document.getElementById("campos-endereco").style.display = "block";
    document.getElementById("c-numero").focus();
    toast("Endereço encontrado ✓", "pink");
  } catch (e) {
    document.getElementById("cep-spinner").style.display = "none";
    toast("Erro ao buscar CEP", "red");
  }
}

// ── NAVEGAÇÃO RÁPIDA ──
function irParaNovaCliente() {
  showPage("clientes");
  document.getElementById("c-nome").focus();
  toast("Cadastre a nova cliente abaixo 💕", "pink");
}

// ── EDITAR / EXCLUIR CLIENTE ──
let clienteEditandoId = null;

function abrirEdicaoCliente(id) {
  const c = DATA.clientes.find((c) => c.id === id);
  if (!c) return;
  clienteEditandoId = id;
  document.getElementById("ec-nome").value = c.nome;
  document.getElementById("ec-tel").value = c.tel || "";
  document.getElementById("ec-local").value = c.local || "";
  document.getElementById("ec-obs").value = c.obs || "";
  document.getElementById("modal-editar-cliente").classList.add("open");
}

async function salvarEdicaoCliente() {
  const c = DATA.clientes.find((c) => c.id === clienteEditandoId);
  if (!c) return;
  const novoNome = document.getElementById("ec-nome").value.trim();
  if (!novoNome) return toast("Nome obrigatório", "red");
  const nomeAntigo = c.nome;
  c.nome = novoNome;
  c.tel = document.getElementById("ec-tel").value.trim();
  c.local = document.getElementById("ec-local").value.trim();
  c.obs = document.getElementById("ec-obs").value.trim();
  // atualizar referências ao nome nos serviços e empréstimos
  if (nomeAntigo !== novoNome) {
    DATA.servicos.forEach((s) => {
      if (s.clienteNome === nomeAntigo) s.clienteNome = novoNome;
    });
    DATA.emprestimos.forEach((e) => {
      if (e.clienteNome === nomeAntigo) e.clienteNome = novoNome;
    });
  }
  fecharModal("modal-editar-cliente");
  renderAll();
  toast("Cliente atualizada ✓", "pink");
  await postData({
    sheet: "Clientes",
    action: "update",
    id: clienteEditandoId,
    headers: ["id", "nome", "tel", "local", "obs", "data"],
    row: [c.id, c.nome, c.tel, c.local, c.obs, c.data],
  });
}

function confirmarExcluirCliente(id) {
  clienteEditandoId = id;
  excluirCliente();
}

async function excluirCliente() {
  const c = DATA.clientes.find((c) => c.id === clienteEditandoId);
  if (!c) return;
  const temServicos = DATA.servicos.some((s) => s.clienteNome === c.nome);
  if (temServicos) {
    if (
      !confirm(
        "Esta cliente tem serviços registrados. Deseja excluí-la mesmo assim?",
      )
    )
      return;
  } else {
    if (!confirm('Excluir cliente "' + c.nome + '"?')) return;
  }
  DATA.clientes = DATA.clientes.filter((x) => x.id !== clienteEditandoId);
  fecharModal("modal-editar-cliente");
  renderAll();
  toast("Cliente excluída", "red");
  await postData({
    sheet: "Clientes",
    action: "delete",
    id: clienteEditandoId,
  });
}

// ── EDITAR / EXCLUIR SERVIÇO ──
let servicoEditandoId = null;

function abrirEdicaoServico(id) {
  const s = DATA.servicos.find((s) => s.id === id);
  if (!s) return;
  servicoEditandoId = id;
  document.getElementById("es-descricao").value = s.descricao;
  document.getElementById("es-valor").value = s.valor;
  document.getElementById("es-pagamento").value = s.pagamento;
  document.getElementById("es-pago").value = s.pago ? "true" : "false";
  document.getElementById("es-obs").value = s.obs || "";
  document.getElementById("modal-editar-servico").classList.add("open");
}

async function salvarEdicaoServico() {
  const s = DATA.servicos.find((s) => s.id === servicoEditandoId);
  if (!s) return;
  s.descricao = document.getElementById("es-descricao").value.trim();
  s.valor = parseFloat(document.getElementById("es-valor").value) || 0;
  s.pagamento = document.getElementById("es-pagamento").value;
  s.pago = document.getElementById("es-pago").value === "true";
  s.obs = document.getElementById("es-obs").value.trim();
  fecharModal("modal-editar-servico");
  renderAll();
  toast("Serviço atualizado ✓", "pink");
  await postData({
    sheet: "Servicos",
    action: "update",
    id: servicoEditandoId,
    headers: [
      "id",
      "clienteNome",
      "tipo",
      "descricao",
      "valor",
      "pagamento",
      "pago",
      "data",
      "hora",
      "obs",
    ],
    row: [
      s.id,
      s.clienteNome,
      s.tipo,
      s.descricao,
      s.valor,
      s.pagamento,
      s.pago,
      s.data,
      s.hora,
      s.obs,
    ],
  });
}

async function excluirServico() {
  excluirServicoById(servicoEditandoId);
  fecharModal("modal-editar-servico");
}

async function excluirServicoById(id) {
  const s = DATA.servicos.find((s) => s.id === id);
  if (!s) return;
  if (
    !confirm("Excluir serviço de " + s.clienteNome + " (" + s.descricao + ")?")
  )
    return;
  // Se foi venda de alicate, estorna no estoque
  if (s.tipo === "venda") {
    const partes = s.descricao.split(", ");
    partes.forEach((parte) => {
      const match = parte.match(/^(\d+)x (.+)$/);
      if (match) {
        const qtd = parseInt(match[1]);
        const modelo = match[2].trim();
        const estorno = {
          id: uid(),
          modelo,
          qtd: +qtd,
          custo: 0,
          data: hoje(),
        };
        DATA.estoque.push(estorno);
        postData({
          sheet: "Estoque",
          action: "append",
          headers: ["id", "modelo", "qtd", "custo", "data"],
          row: [
            estorno.id,
            estorno.modelo,
            estorno.qtd,
            estorno.custo,
            estorno.data,
          ],
        });
      }
    });
    toast("Serviço excluído — estoque restaurado ✓", "pink");
  } else {
    toast("Serviço excluído", "red");
  }
  DATA.servicos = DATA.servicos.filter((x) => x.id !== id);
  renderAll();
  await postData({ sheet: "Servicos", action: "delete", id });
}

// ── PWA ──
let deferredPrompt = null;

function setupPWA() {
  // Gera manifest dinamicamente
  const manifest = {
    name: "Afiações by Cris",
    short_name: "AfiaCris",
    description: "Sistema de gestão de serviços",
    start_url: "./",
    display: "standalone",
    background_color: "#FDF5FA",
    theme_color: "#E91E8C",
    icons: [
      {
        src: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect width="192" height="192" rx="32" fill="%23E91E8C"/><text x="96" y="130" font-size="110" text-anchor="middle">✂️</text></svg>',
        sizes: "192x192",
        type: "image/svg+xml",
      },
      {
        src: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="80" fill="%23E91E8C"/><text x="256" y="360" font-size="300" text-anchor="middle">✂️</text></svg>',
        sizes: "512x512",
        type: "image/svg+xml",
      },
    ],
  };
  const blob = new Blob([JSON.stringify(manifest)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  document.getElementById("pwa-manifest").setAttribute("href", url);

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const banner = document.getElementById("pwa-banner");
    if (!localStorage.getItem("pwa-dismissed")) banner.classList.add("show");
  });

  document
    .getElementById("pwa-install-btn")
    .addEventListener("click", async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        deferredPrompt = null;
        fecharPWABanner();
        if (outcome === "accepted")
          toast("App instalado com sucesso! 📲", "pink");
      }
    });

  window.addEventListener("appinstalled", () => {
    fecharPWABanner();
    toast("App instalado! 🎉", "pink");
  });
}

function fecharPWABanner() {
  document.getElementById("pwa-banner").classList.remove("show");
  localStorage.setItem("pwa-dismissed", "1");
}

// ── AJUSTE MANUAL DE ESTOQUE ──
let estoqueModeloAjuste = null;

function abrirAjusteEstoque(modelo, qtdAtual) {
  estoqueModeloAjuste = modelo;
  document.getElementById("ee-nome-modelo").textContent = modelo;
  document.getElementById("ee-qtd-atual").value = qtdAtual;
  document.getElementById("ee-qtd-nova").value = qtdAtual;
  document.getElementById("modal-editar-estoque").classList.add("open");
}

async function salvarAjusteEstoque() {
  if (!estoqueModeloAjuste) return;
  const qtdAtual = parseInt(document.getElementById("ee-qtd-atual").value) || 0;
  const qtdNova = parseInt(document.getElementById("ee-qtd-nova").value);
  if (isNaN(qtdNova) || qtdNova < 0)
    return toast("Informe uma quantidade válida", "red");
  const diff = qtdNova - qtdAtual;
  if (diff === 0) {
    fecharModal("modal-editar-estoque");
    return toast("Sem alteração", "");
  }
  const ajuste = {
    id: uid(),
    modelo: estoqueModeloAjuste,
    qtd: diff,
    custo: 0,
    data: hoje(),
  };
  DATA.estoque.push(ajuste);
  fecharModal("modal-editar-estoque");
  renderAll();
  const tipo = diff > 0 ? "+" + diff + " (entrada)" : diff + " (saída)";
  toast("Estoque ajustado " + tipo, "pink");
  await postData({
    sheet: "Estoque",
    action: "append",
    headers: ["id", "modelo", "qtd", "custo", "data"],
    row: [ajuste.id, ajuste.modelo, ajuste.qtd, ajuste.custo, ajuste.data],
  });
}

// Fecha modais ao clicar no fundo
document
  .getElementById("modal-editar-estoque")
  .addEventListener("click", function (e) {
    if (e.target === this) fecharModal("modal-editar-estoque");
  });
document
  .getElementById("modal-editar-servico")
  .addEventListener("click", function (e) {
    if (e.target === this) fecharModal("modal-editar-servico");
  });

setupPWA();

carregarConfig();

if (!CFG.url) {
  // primeira vez — mostrar config
  document.getElementById("login-screen").style.display = "none";
  document.getElementById("config-screen").style.display = "flex";
} else {
  document.getElementById("login-screen").style.display = "flex";
}

document
  .getElementById("modal-cliente")
  .addEventListener("click", function (e) {
    if (e.target === this) fecharModal("modal-cliente");
  });
