// Wait for the DOM to be fully loaded before running scripts
document.addEventListener('DOMContentLoaded', () => {

  // --- Globals & DOM Elements ---
  const loginSection = document.getElementById('login-section');
  const mainContent = document.getElementById('main-content');
  const propertyIdInput = document.getElementById('propertyIdInput');
  const loginButton = document.getElementById('loginButton');
  const loginError = document.getElementById('login-error');
  const loginLoading = document.getElementById('login-loading');
  const fileInput = document.getElementById('fileInput');
  const fileFeedback = document.getElementById('file-feedback');
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');
  const headerTitle = document.getElementById('header-title');

  let map = null; // Leaflet map instance
  let layerControl = null; // Leaflet layer control instance
  let baseLayer = null; // Base map layer
  let propertyLayerGroup = L.layerGroup(); // Group for property boundary
  let appLayerGroup = L.layerGroup(); // Group for APP areas
  let rlLayerGroup = L.layerGroup(); // Group for RL areas

  let currentPropertyData = null; // Holds the data for the currently loaded property

  // --- Mock Data Store (Based on Relatório - Mangaratiba.docx) ---
  // (Estrutura de dados da resposta anterior - omitida aqui por brevidade, mas deve estar presente)
  const propertyDataStore = {
    propriedade123: {
      id: 'propriedade123', nome: "Propriedade Exemplo (Mangaratiba)",
      gerais: { carId: "Área numa região do município", municipio: "Mangaratiba", estado: "RJ", areaAnunciadaCAR: 998.39, areaCalculada: 998.39, perimetroCalculado: 11205.48, srcOriginal: "EPSG 4674 - SIRGAS 2000", srcCalculos: "EPSG 31983 - SIRGAS 2000 - UTM 23S", centroide: { lat: -22.90536022370211, lon: -44.1146100347124 }, solos: [ { tipo: "LATOSSOLO - VERMELHO-AMARELO", area: 436.9, carbonoTonHa: 53.2 }, { tipo: "CAMBISSOLO - HAPLICO", area: 205.9, carbonoTonHa: 57.6 }, { tipo: "CAMBISSOLO - HAPLICO", area: 355.6, carbonoTonHa: 57.6 } ], bioma: { nome: "Mata Atlântica", area: 998.4 }, fitofisionomias: [ { tipo: "Floresta Ombrófila Densa Submontana", area: 983.2, carbonoTonHa: 78.5 }, { tipo: "Floresta Ombrófila Densa Montana", area: 15.2, carbonoTonHa: 78.5 } ], incrementoCarbonoVegetacaoAno: 7.57 },
      app: { area: 151.92, perimetro: 107766.33, proporcaoPropriedade: 15.22, statusLegal: "Dentro de uma área de Reserva Ambiental" },
      rl: { area: 13.64, perimetro: 2930.38, proporcaoPropriedade: 1.37, statusLegal: "Dentro de uma área de Reserva Ambiental" },
      areaUtil: 835.38,
      intersecao: { appForaPropriedade: 0.00, rlForaPropriedade: 0.00, rlForaAPP: 11.10, appForaRL: 149.37 },
      vegetacaoConectividade: { propriedade: { areaVegDensaM2: 9755679, percVegDensa: 97.71, areaSemVegDensaM2: 228264, percSemVegDensa: 2.29, qtdFragmentosVegDensa: 4, areaVegDensaSemAppRlM2: 8169433, percVegDensaSemAppRl: 97.79 }, app: { areaTotalM2: 1519192, areaVegDensaM2: 1477991, ivapp: 97.00, areaSemVegDensaM2: 41201, percSemVegDensa: 2.71 }, rl: { areaTotalM2: 136418, areaVegDensaM2: 131537, ivrl: 96.42, areaSemVegDensaM2: 4881, percSemVegDensa: 3.58 }, regional: { distMediaCentroidesVeg: 1668.46, distMediaCentroidesSemVeg: 3212.96, poligonosVegDensaTotal: 1616, poligonosVegDensaSup200m: 144, poligonosSemVegDensaTotal: 3362, poligonosSemVegDensaSup200m: 343, percAreaTotalVegDensa: 91.38, percAreaTotalSemVegDensa: 8.62, icvdBlocos: 77.78, icvdArea: 99.81, icvd2Area: 99.50, analiseRaios: [ { raio: 500, vegDensa: 91.59, semVegDensa: 8.41 }, { raio: 700, vegDensa: 93.75, semVegDensa: 6.25 }, { raio: 900, vegDensa: 94.14, semVegDensa: 5.86 }, { raio: 1100, vegDensa: 95.14, semVegDensa: 4.86 }, { raio: 1300, vegDensa: 96.40, semVegDensa: 3.60 }, { raio: 1500, vegDensa: 97.08, semVegDensa: 2.92 }, { raio: 1700, vegDensa: 97.61, semVegDensa: 2.39 }, { raio: 1900, vegDensa: 97.77, semVegDensa: 2.23 } ] } },
      hidrico: { macroBacia: "ATLÂNTICO SUDESTE", mesoBacia: "Litoral do Rio de Janeiro", microBacia: "Guandu (RJ)", nascentesQtd: 14, componentesHidricosTotal: 45, componentesAppTotal: 64, percComponentesApp: 70, tiposComponentesApp: ['APP_RIO_ATE_10', 'APP_ESCADINHA_RIO_ATE_10', 'APP_NASCENTE_OLHO_DAGUA', 'APP_LAGO_NATURAL', 'APP_ESCADINHA_LAGO_NATURAL'], rioMaisProximo: { nome: "Rio Ingaíba", distancia: 1082.1 }, riosCruzadosBuffer10km: ['Linha de Costa', 'Rio Ingaíba', 'Rio São Brás', 'Rio dos Pires'] },
      clima: { anoReferencia: 2024, precipitacaoAnualMm: 1313.6, captacaoAguaM3: 13115208, tempMaxC: 35.3, tempMinC: 11.4, tempMediaC: 22.7, radiacaoSolarKwhM2Dia: 17.5, radiacaoSolarCeuClaroKwhM2Dia: 23.9, radiacaoDifusaKwhM2Dia: 7.0, umidadeEspecificaGKg: 13.6, umidadeRelativaPerc: 76.6, pontoOrvalhoC: 17.8, ventoVel2mMs: 1.4, ventoDir2mGraus: 148.3, ventoVel10mMs: 2.1, ventoDir10mGraus: 155.9, pressaoSuperficiePa: 96600, tempSuperficieC: 23.0, evapotranspiracaoMmDia: 2.0, altitudeMediaM: 160.00, climaChartData: { labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'], temp: [26, 27, 26, 24, 22, 20, 19, 20, 21, 23, 24, 25], precip: [150, 140, 130, 90, 70, 50, 40, 30, 50, 90, 120, 150] } },
      valoracao: { carbonoTotalVegTon: 76582, carbonoTotalSoloTon: 55585, valorMercadoTonCarbono: 50.00, valorTotalCarbonoVegRS: 3829104.18, valorTotalCarbonoSoloRS: 2779257.17, rl: { carbonoVegTon: 1033, valorRS: 51628.44, carbonoSoloTon: 763, valorRS: 38135.09 }, app: { carbonoVegTon: 11602, valorRS: 580111.45, carbonoSoloTon: 8385, valorRS: 419249.91 }, restante: { carbonoVegTon: 64130, valorRS: 3206502.40, carbonoSoloTon: 46575, valorRS: 2328753.35 }, valorEstimadoPropriedadeRS: 19967800.00, valorEstimadoHaRS: 20000.00, lucroEstimadoAnoRS: 1996780.00, lucroEstimadoHaAnoRS: 2000.00 },
      social: { areasConservacao: [ { nome: "ÁREA DE PROTEÇÃO AMBIENTAL DE MANGARATIBA", categoria: "Estadual Uso Sustentável", distancia: 0.0, areaHa: 24496.9 }, { nome: "PARQUE ESTADUAL CUNHAMBEBE", categoria: "Estadual Proteção Integral", distancia: 0.0, areaHa: 38076.0 }, { nome: "RPPN FAZENDA SANTA IZABEL", categoria: "Federal Uso Sustentável", distancia: 5283.1, areaHa: 521.6 } ], terrasIndigenas: [ { nome: "Guarani de Bracui", distancia: 22526.9, areaHa: 2135.0 }, { nome: "Tekoha Jevy (Rio Pequeno)", distancia: 63465.7, areaHa: 2363.3 } ], quilombolas: [ { nome: "Santa Justina", distancia: 4045.0, areaHa: 1358.4 }, { nome: "Alto da Serra", distancia: 8113.1, areaHa: 215.4 } ], assentamentos: [ { nome: "PA BATATAL", distancia: 3041.6, areaHa: 198.4 }, { nome: "PIC SANTA ALICE", distancia: 27267.6, areaHa: 8978.6 } ] },
      charts: { vegetacaoPie: { labels: ['APP', 'Reserva Legal', 'Área Produtiva'], data: [15.22, 1.37, 83.41], colors: ['#2196F3', '#ffeb3b', '#4CAF50'] }, vegetacaoBar: { labels: ['APP', 'Reserva Legal', 'Área Produtiva'], data: [151.92, 13.64, 835.38], colors: ['#2196F3', '#ffeb3b', '#4CAF50'] }, carbonoBar: { labels: ['Carbono Solo', 'Carbono Vegetação', 'Carbono Total'], data: [55585, 76582, 132167], colors: ['#8BC34A', '#4CAF50', '#2E7D32'] }, hidricoBar: { labels: ['Nascentes', 'Comp. Hídricos', 'Comp. APP'], data: [14, 45, 64], colors: ['#03A9F4', '#0288D1', '#01579B'] }, valoracaoBar: { labels: ['Valor Carbono APP', 'Valor Carbono RL', 'Valor Carbono Restante', 'Lucro Anual Estimado'], data: [(580111.45 + 419249.91)/1000, (51628.44 + 38135.09)/1000, (3206502.40 + 2328753.35)/1000, 1996780.00/1000], colors: ['#FFD600', '#FFC107', '#FFB300', '#FFA000'] } }
    },
    propriedade456: { id: 'propriedade456', nome: "Sítio Verde (Dados Simulados)", gerais: { municipio: "Exemplo Mun.", estado: "EX", areaCalculada: 250.5, centroide: { lat: -22.5, lon: -45.5 } }, app: {}, rl: {}, vegetacaoConectividade: { propriedade: {}, app: {}, rl: {}, regional: {} }, hidrico: {}, clima: { climaChartData: {} }, valoracao: {}, social: {}, charts: {} },
    propriedade789: { id: 'propriedade789', nome: "Chácara Sol Nascente (Dados Simulados)", gerais: { municipio: "Outro Mun.", estado: "OT", areaCalculada: 50.0, centroide: { lat: -23.0, lon: -47.0 } }, app: {}, rl: {}, vegetacaoConectividade: { propriedade: {}, app: {}, rl: {}, regional: {} }, hidrico: {}, clima: { climaChartData: {} }, valoracao: {}, social: {}, charts: {} }
  };


  // --- Functions ---

  /**
   * Validates the property ID and handles login flow.
   */
  function handleLogin() {
    const id = propertyIdInput.value.trim().toLowerCase();
    loginError.style.display = 'none';
    loginLoading.style.display = 'block';
    loginButton.disabled = true;

    setTimeout(() => {
      loginLoading.style.display = 'none';
      loginButton.disabled = false;

      if (propertyDataStore[id]) {
        currentPropertyData = propertyDataStore[id];
        loginSection.style.display = 'none';
        mainContent.style.display = 'block';
        headerTitle.textContent = `Diagnóstico Ambiental: ${currentPropertyData.nome || id}`;
        initializeUI(); // Initialize UI *after* setting currentPropertyData
      } else {
        loginError.textContent = "ID da propriedade inválido. Tente 'propriedade123'.";
        loginError.style.display = 'block';
        headerTitle.textContent = 'Diagnóstico Ambiental - Plataforma ENDLESSGREEN';
        currentPropertyData = null;
        // Optionally hide main content if login fails after being shown once
        // mainContent.style.display = 'none';
      }
    }, 500);
  }

   /**
    * Populates the UI elements with data from the currentPropertyData object.
    * REVISADO: Garante que IDs e caminhos dos dados estão corretos.
    */
   function populateUI() {
       if (!currentPropertyData) {
           console.error("populateUI chamada sem currentPropertyData.");
           return;
       }
       console.log("Populando UI com dados para:", currentPropertyData.id); // Debug

        // Helper function to safely set text content
        const setText = (id, value, unit = '', decimals = 2) => {
            const element = document.getElementById(id);
            if (element) {
                 let displayValue = '--';
                 if (value !== null && value !== undefined && value !== '') {
                    // Check if it's a number before formatting
                    if (typeof value === 'number' && !isNaN(value)) {
                       displayValue = value.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
                    } else {
                       displayValue = String(value); // Convert to string to be safe
                    }
                    displayValue += unit;
                 }
                 element.textContent = displayValue;
            } else {
                // console.warn(`Elemento com ID '${id}' não encontrado.`); // Debugging
            }
        };

        // Helper function to create list items
         const createListItem = (label, value, unit = '', decimals = 2) => {
             const li = document.createElement('li');
             const labelSpan = document.createElement('span');
             labelSpan.className = 'detail-label';
             labelSpan.textContent = `${label}:`;
             const valueSpan = document.createElement('span');

              let displayValue = '--';
              // Check for null/undefined/empty string explicitly
              if (value !== null && value !== undefined && value !== '') {
                   if (typeof value === 'number' && !isNaN(value)) {
                       displayValue = value.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
                  } else {
                      displayValue = String(value);
                  }
                  displayValue += unit;
              }
             valueSpan.textContent = displayValue;

             li.appendChild(labelSpan);
             li.appendChild(valueSpan);
             return li;
         };

         // Helper function to populate lists
         const populateList = (listId, items) => {
            const listElement = document.getElementById(listId);
            if(listElement) {
                listElement.innerHTML = ''; // Clear previous items
                if (items && items.length > 0) {
                   items.forEach(item => listElement.appendChild(item));
                } else {
                   listElement.innerHTML = '<li><span class="detail-label">Dados não disponíveis</span><span></span></li>';
                }
            } else {
                 // console.warn(`Elemento de lista com ID '${listId}' não encontrado.`); // Debugging
            }
         };

        // --- Populate Resumo Tab ---
        // (Corrigido para verificar existência do dado antes de acessar propriedades)
        setText('resumo-prop-nome', currentPropertyData.nome || '');
        setText('kpi-area-total', currentPropertyData.gerais?.areaCalculada, ' ha', 2);
        setText('kpi-veg-densa-perc', currentPropertyData.vegetacaoConectividade?.propriedade?.percVegDensa, ' %', 2);
        setText('kpi-app-perc', currentPropertyData.app?.proporcaoPropriedade, ' %', 2);
        setText('kpi-rl-perc', currentPropertyData.rl?.proporcaoPropriedade, ' %', 2);
        const carbonoTotal = (currentPropertyData.valoracao?.carbonoTotalVegTon || 0) + (currentPropertyData.valoracao?.carbonoTotalSoloTon || 0);
        setText('kpi-carbono-total', carbonoTotal, ' t', 0);
        const valorTotal = (currentPropertyData.valoracao?.valorTotalCarbonoVegRS || 0) + (currentPropertyData.valoracao?.valorTotalCarbonoSoloRS || 0);
        setText('kpi-valor-ambiental', valorTotal, 'R$ ', 2);

        // --- Populate Mapa e Detalhes Tab ---
        const gerais = currentPropertyData.gerais;
        setText('info-car-id', gerais?.carId);
        setText('info-municipio-uf', `${gerais?.municipio || '--'} / ${gerais?.estado || '--'}`);
        setText('info-area', gerais?.areaCalculada, ' ha');
        setText('info-perimetro', gerais?.perimetroCalculado, ' m');
        const lat = gerais?.centroide?.lat;
        const lon = gerais?.centroide?.lon;
        setText('info-centroide', (lat && lon) ? `Lat: ${lat.toFixed(6)} | Lon: ${lon.toFixed(6)}` : '--');
        setText('info-src-original', gerais?.srcOriginal);
        setText('info-src-calculos', gerais?.srcCalculos);

        const soloItems = gerais?.solos?.map(s => createListItem(s.tipo, s.area, ' ha')) || [];
        populateList('info-solos-list', soloItems);

         const biomaItems = gerais?.bioma ? [createListItem('Bioma', gerais.bioma.nome, ` (${gerais.bioma.area.toLocaleString('pt-BR')} ha)`)] : [];
         gerais?.fitofisionomias?.forEach(f => {
             biomaItems.push(createListItem(f.tipo, f.area, ' ha'));
         });
        populateList('info-bioma-list', biomaItems);

        setText('info-app-area', currentPropertyData.app?.area, ' ha');
        setText('info-app-perc-detalhe', currentPropertyData.app?.proporcaoPropriedade, '', 2);
        setText('info-app-perimetro', currentPropertyData.app?.perimetro, ' m');
        setText('info-rl-area', currentPropertyData.rl?.area, ' ha');
        setText('info-rl-perc-detalhe', currentPropertyData.rl?.proporcaoPropriedade, '', 2);
        setText('info-rl-perimetro', currentPropertyData.rl?.perimetro, ' m');
        setText('info-area-util', currentPropertyData.areaUtil, ' ha');


       // --- Populate Vegetação Tab ---
       const vegProp = currentPropertyData.vegetacaoConectividade?.propriedade;
       setText('veg-prop-densa-perc', vegProp?.percVegDensa, '', 2);
       setText('veg-prop-densa-area', vegProp?.areaVegDensaM2, ' m²', 0);
       setText('veg-prop-sem-densa-perc', vegProp?.percSemVegDensa, '', 2);
       setText('veg-prop-sem-densa-area', vegProp?.areaSemVegDensaM2, ' m²', 0);
       setText('veg-prop-fragmentos', vegProp?.qtdFragmentosVegDensa, '', 0);
       setText('veg-app-densa-perc', currentPropertyData.vegetacaoConectividade?.app?.ivapp, '', 0);
       setText('veg-rl-densa-perc', currentPropertyData.vegetacaoConectividade?.rl?.ivrl, '', 2);

       const conectReg = currentPropertyData.vegetacaoConectividade?.regional;
       setText('conect-icvd-blocos', conectReg?.icvdBlocos, '', 2);
       setText('conect-icvd-area', conectReg?.icvdArea, '', 2);
       setText('conect-icvd2-area', conectReg?.icvd2Area, '', 2);
       setText('conect-polig-veg', conectReg?.poligonosVegDensaSup200m, '', 0);
       setText('conect-polig-sem-veg', conectReg?.poligonosSemVegDensaSup200m, '', 0);

        const raiosTableDiv = document.getElementById('conect-raios-table');
        if (raiosTableDiv && conectReg?.analiseRaios) {
            let tableHTML = '<table class="simple-table"><thead><tr><th>Raio (m)</th><th>Veg. Densa (%)</th><th>Sem Veg. (%)</th></tr></thead><tbody>';
            conectReg.analiseRaios.forEach(r => {
                tableHTML += `<tr><td>${r.raio}</td><td>${r.vegDensa?.toFixed(2) ?? '--'}%</td><td>${r.semVegDensa?.toFixed(2) ?? '--'}%</td></tr>`;
            });
            tableHTML += '</tbody></table>';
            raiosTableDiv.innerHTML = tableHTML;
        } else if (raiosTableDiv) {
             raiosTableDiv.innerHTML = '<p>Dados de análise de raios não disponíveis.</p>';
        }


       // --- Populate Carbono Tab ---
        const carb = currentPropertyData.valoracao; // Usando valoração pois já tem os totais calculados
        setText('carb-veg-total', carb?.carbonoTotalVegTon, ' t', 0);
        setText('carb-solo-total', carb?.carbonoTotalSoloTon, ' t', 0);
        setText('carb-geral-total', (carb?.carbonoTotalVegTon || 0) + (carb?.carbonoTotalSoloTon || 0), ' t', 0);
        setText('carb-incremento', currentPropertyData.gerais?.incrementoCarbonoVegetacaoAno, ' t/ha/ano');

        setText('carb-veg-app', carb?.app?.carbonoVegTon, '', 0);
        setText('carb-solo-app', carb?.app?.carbonoSoloTon, '', 0);
        setText('carb-veg-rl', carb?.rl?.carbonoVegTon, '', 0);
        setText('carb-solo-rl', carb?.rl?.carbonoSoloTon, '', 0);
        setText('carb-veg-restante', carb?.restante?.carbonoVegTon, '', 0);
        setText('carb-solo-restante', carb?.restante?.carbonoSoloTon, '', 0);

        const carbTipoList = document.getElementById('carb-por-tipo-list');
        if(carbTipoList) {
             let listHTML = '<ul class="details-list">';
             const addedTypes = new Set(); // Para evitar duplicatas na lista
             currentPropertyData.gerais?.fitofisionomias?.forEach(f => {
                  if(f.tipo && !addedTypes.has(f.tipo + '_veg')) {
                     listHTML += `<li><span class="detail-label">${f.tipo} (Veg):</span> <span>${f.carbonoTonHa?.toLocaleString('pt-BR') ?? '--'} t/ha</span></li>`;
                     addedTypes.add(f.tipo + '_veg');
                  }
             });
              currentPropertyData.gerais?.solos?.forEach(s => {
                  if(s.tipo && !addedTypes.has(s.tipo + '_solo')) {
                     listHTML += `<li><span class="detail-label">${s.tipo} (Solo):</span> <span>${s.carbonoTonHa?.toLocaleString('pt-BR') ?? '--'} t/ha</span></li>`;
                      addedTypes.add(s.tipo + '_solo');
                 }
             });
             listHTML += '</ul>';
             carbTipoList.innerHTML = listHTML;
        }


       // --- Populate Hidrico Tab ---
        const hidrico = currentPropertyData.hidrico;
        setText('hidrico-nascentes', hidrico?.nascentesQtd, '', 0);
        setText('hidrico-componentes-total', hidrico?.componentesHidricosTotal, '', 0);
        setText('hidrico-componentes-app', hidrico?.componentesAppTotal, '', 0);
        setText('hidrico-componentes-app-perc', hidrico?.percComponentesApp, '', 0);
        // Limita a exibição dos tipos de APP para não ficar muito longo
        const tiposAppDisplay = hidrico?.tiposComponentesApp?.slice(0, 3).join(', ') + (hidrico?.tiposComponentesApp?.length > 3 ? '...' : '');
        setText('hidrico-tipos-app', tiposAppDisplay || '--');

        setText('hidrico-microbacia', hidrico?.microBacia);
        setText('hidrico-mesobacia', hidrico?.mesoBacia);
        setText('hidrico-macrobacia', hidrico?.macroBacia);

        setText('hidrico-rio-prox-nome', hidrico?.rioMaisProximo?.nome);
        setText('hidrico-rio-prox-dist', hidrico?.rioMaisProximo?.distancia, ' m', 1);
        setText('hidrico-rios-buffer', hidrico?.riosCruzadosBuffer10km?.join(', ') || '--');


       // --- Populate Clima Tab ---
       const clima = currentPropertyData.clima;
       setText('clima-ano', clima?.anoReferencia || '--', '', 0);
       setText('clima-precipitacao', clima?.precipitacaoAnualMm, '', 1);
       setText('clima-temp-media', clima?.tempMediaC, '', 1);
       setText('clima-temp-max', clima?.tempMaxC, '', 1);
       setText('clima-temp-min', clima?.tempMinC, '', 1);
       setText('clima-radiacao', clima?.radiacaoSolarKwhM2Dia, '', 1);
       setText('clima-radiacao-difusa', clima?.radiacaoDifusaKwhM2Dia, '', 1);
       setText('clima-umidade-rel', clima?.umidadeRelativaPerc, '', 1);
       setText('clima-umidade-esp', clima?.umidadeEspecificaGKg, '', 1);
       setText('clima-vento-10m', clima?.ventoVel10mMs, '', 1);
       setText('clima-vento-10m-dir', clima?.ventoDir10mGraus, '', 1);
       setText('clima-altitude', clima?.altitudeMediaM, '', 2);
       setText('clima-evapo', clima?.evapotranspiracaoMmDia, '', 1);
       setText('clima-temp-superficie', clima?.tempSuperficieC, '', 1);


       // --- Populate Valoração Tab ---
       const val = currentPropertyData.valoracao;
        setText('val-carb-veg-total', val?.valorTotalCarbonoVegRS, '', 2);
        setText('val-carb-solo-total', val?.valorTotalCarbonoSoloRS, '', 2);
        setText('val-carb-geral-total', (val?.valorTotalCarbonoVegRS || 0) + (val?.valorTotalCarbonoSoloRS || 0), '', 2);
        setText('val-preco-tonelada', val?.valorMercadoTonCarbono, '', 2);
        // Calcular valor total APP/RL
        const valAppTotal = (val?.app?.valorRS || 0) + (val?.app?.valorRS || 0); // Precisa corrigir a estrutura de dados se for veg+solo
        const valRlTotal = (val?.rl?.valorRS || 0) + (val?.rl?.valorRS || 0);
        const valRestanteTotal = (val?.restante?.valorRS || 0) + (val?.restante?.valorRS || 0);
        setText('val-carb-app', valAppTotal, '', 2); // Substituir por cálculo correto se necessário
        setText('val-carb-rl', valRlTotal, '', 2);
        setText('val-carb-restante', valRestanteTotal, '', 2);

        setText('val-prop-terra', val?.valorEstimadoPropriedadeRS, '', 2);
        setText('val-prop-terra-ha', val?.valorEstimadoHaRS, '', 2);
        setText('val-prop-lucro', val?.lucroEstimadoAnoRS, '', 2);
        setText('val-prop-lucro-ha', val?.lucroEstimadoHaAnoRS, '', 2);


       // --- Populate Social Tab ---
       const social = currentPropertyData.social;
       const populateSocialList = (listId, dataArray) => {
            const listElement = document.getElementById(listId);
            if(listElement) {
                listElement.innerHTML = ''; // Clear previous
                if (dataArray && dataArray.length > 0) {
                    // Limita a 5 itens para não ficar muito longo
                    dataArray.slice(0, 5).forEach(item => {
                        const li = document.createElement('li');
                        li.innerHTML = `<span class="detail-label">${item.nome || 'Nome não disponível'}</span>
                                        <span class="social-details">${item.categoria ? `Categoria: ${item.categoria} | ` : ''}Distância: ${item.distancia?.toLocaleString('pt-BR', {maximumFractionDigits: 1})} m ${item.areaHa ? `| Área: ${item.areaHa?.toLocaleString('pt-BR')} ha` : ''}</span>`;
                        listElement.appendChild(li);
                    });
                    if (dataArray.length > 5) {
                        listElement.innerHTML += '<li><span class="social-details">... e mais.</span></li>';
                    }
                } else {
                    listElement.innerHTML = '<li>Nenhuma área próxima encontrada nos dados.</li>';
                }
            }
       };
       populateSocialList('social-conservacao', social?.areasConservacao);
       populateSocialList('social-indigenas', social?.terrasIndigenas);
       populateSocialList('social-quilombolas', social?.quilombolas);
       populateSocialList('social-assentamentos', social?.assentamentos);

        console.log("PopulateUI concluído."); // Debug
   }


  /**
   * Initializes the main UI elements (Map, Charts).
   */
  function initializeUI() {
    if (!currentPropertyData) {
        console.error("initializeUI chamada sem currentPropertyData.");
        return;
    }
    initializeMap(); // Initialize or update map view
    initializeCharts(); // Load charts with data from currentPropertyData
    populateUI(); // Fill in all the text details *AFTER* data is set

    // Ensure the correct tab is active (Resumo is default on first load)
    openTab('resumoTab');
  }

  /**
   * Switches the visible tab content.
   * @param {string} tabId - The ID of the tab content to display.
   */
  function openTab(tabId) {
    tabContents.forEach(content => content.classList.remove('active'));
    tabButtons.forEach(button => {
        button.classList.remove('active');
        button.setAttribute('aria-selected', 'false');
    });

    const selectedContent = document.getElementById(tabId);
    if (selectedContent) {
      selectedContent.classList.add('active');
    } else {
        console.error(`Conteúdo da aba com ID '${tabId}' não encontrado.`);
        // Fallback to the first tab if the requested one doesn't exist
         document.getElementById('resumoTab').classList.add('active');
         document.getElementById('btn-resumoTab').classList.add('active');
         document.getElementById('btn-resumoTab').setAttribute('aria-selected', 'true');
         return; // Exit early
    }

    const selectedButton = document.getElementById(`btn-${tabId}`);
     if (selectedButton) {
        selectedButton.classList.add('active');
        selectedButton.setAttribute('aria-selected', 'true');
     } else {
          console.error(`Botão da aba para controle '${tabId}' não encontrado.`);
          // Activate the default button as fallback
          document.getElementById('btn-resumoTab').classList.add('active');
          document.getElementById('btn-resumoTab').setAttribute('aria-selected', 'true');
     }

     if (tabId === 'mapTab' && map) {
         setTimeout(() => {
             console.log("Invalidando tamanho do mapa..."); // Debug
             map.invalidateSize();
            }, 100);
     }
  }

  /**
   * Initializes the Leaflet map and layer control.
   * MODIFICADO: Adiciona LayerGroups e Controle de Camadas.
   */
  function initializeMap() {
    if (!map) {
        console.log("Inicializando mapa pela primeira vez..."); // Debug
        map = L.map('map').setView([-14.235, -51.925], 4); // Center on Brazil

        // --- Base Map Layer ---
        baseLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 18,
        });
        baseLayer.addTo(map);

        // --- Layer Groups (Initially empty) ---
        propertyLayerGroup = L.layerGroup().addTo(map); // Add to map by default
        appLayerGroup = L.layerGroup().addTo(map);    // Add to map by default
        rlLayerGroup = L.layerGroup().addTo(map);     // Add to map by default

        // --- Layer Control ---
        const overlayMaps = {
             // Usar <span> com classe para estilo CSS (se definido) ou texto simples
            // '<span class="layer-propriedade">Propriedade</span>': propertyLayerGroup,
            // '<span class="layer-app">APP</span>': appLayerGroup,
            // '<span class="layer-rl">RL</span>': rlLayerGroup
             "<span>Propriedade</span>": propertyLayerGroup, // Nome usado no CSS :has(input[value=...])
             "<span>APP</span>": appLayerGroup,
             "<span>RL</span>": rlLayerGroup
        };

        layerControl = L.control.layers(null, overlayMaps, {
             position: 'topright', // Position control
             collapsed: false // Keep it expanded initially
             }).addTo(map);

        fileInput.addEventListener('change', handleFileSelect);

    }
    // --- Update map view for the current property ---
     if (currentPropertyData?.gerais?.centroide?.lat && currentPropertyData?.gerais?.centroide?.lon) {
        map.setView([currentPropertyData.gerais.centroide.lat, currentPropertyData.gerais.centroide.lon], 12);
     } else {
         map.setView([-14.235, -51.925], 4); // Reset to Brazil view if no centroid
     }

     // Clear existing GeoJSON layers when loading a new property
     clearGeoJsonLayers();
     fileFeedback.textContent = 'Carregue um GeoJSON com camadas para esta propriedade.';
     fileInput.value = ''; // Reset file input
  }

   /**
    * Clears all features from the GeoJSON layer groups.
    */
   function clearGeoJsonLayers() {
       propertyLayerGroup.clearLayers();
       appLayerGroup.clearLayers();
       rlLayerGroup.clearLayers();
       console.log("Camadas GeoJSON limpas."); // Debug
   }

  /**
   * Handles the GeoJSON file selection, styling, and layer grouping.
   * MODIFICADO: Adiciona estilo e agrupamento por tipo.
   * @param {Event} event - The file input change event.
   */
   function handleFileSelect(event) {
    const file = event.target.files[0];
    fileFeedback.textContent = '';
    clearGeoJsonLayers(); // Clear previous layers first

    if (!file) { /* ... (error handling unchanged) ... */ return; }
    if (file.type !== 'application/geo+json' && !file.name.endsWith('.geojson')) { /* ... */ return; }

    fileFeedback.textContent = `Carregando ${file.name}...`;
    const reader = new FileReader();

    reader.onload = function(e) {
      try {
        const geojsonData = JSON.parse(e.target.result);
        console.log("GeoJSON carregado:", geojsonData); // Debug

        // --- Process GeoJSON Features ---
        const geoJsonLayer = L.geoJSON(geojsonData, {
            style: function (feature) {
                // --- Define Style based on feature property 'tipo' ---
                const tipo = feature.properties?.tipo?.toUpperCase(); // Assume property 'tipo' exists
                switch (tipo) {
                    case 'PROPRIEDADE':
                        return { color: "#666666", weight: 2, opacity: 1, fillOpacity: 0.1, fillColor: "#cccccc" }; // Grayish
                    case 'APP':
                        return { color: "#007bff", weight: 1.5, opacity: 1, fillOpacity: 0.4, fillColor: "#3388ff" }; // Blue
                    case 'RL':
                        return { color: "#28a745", weight: 1.5, opacity: 1, fillOpacity: 0.4, fillColor: "#28a745" }; // Green
                    default:
                        console.warn("Feição sem tipo definido ou tipo não reconhecido:", feature.properties?.tipo);
                        return { color: "#ff7800", weight: 1, opacity: 0.8, fillOpacity: 0.2 }; // Default orange
                }
            },
            onEachFeature: function (feature, layer) {
                 // --- Add Feature to Corresponding Layer Group ---
                 const tipo = feature.properties?.tipo?.toUpperCase();
                 let added = false;
                 if (tipo === 'PROPRIEDADE') {
                     propertyLayerGroup.addLayer(layer);
                     added = true;
                 } else if (tipo === 'APP') {
                     appLayerGroup.addLayer(layer);
                      added = true;
                 } else if (tipo === 'RL') {
                     rlLayerGroup.addLayer(layer);
                      added = true;
                 }
                 // Optionally add to a default layer if type is unknown/missing
                 // else { propertyLayerGroup.addLayer(layer); }


                 // --- Add Popup ---
                 let popupContent = `<strong>Tipo:</strong> ${feature.properties?.tipo || 'Não definido'}<br>`;
                 if (feature.properties) {
                    for (const key in feature.properties) {
                        // Avoid repeating 'tipo' in popup if already shown
                        if (key !== 'tipo' && Object.prototype.hasOwnProperty.call(feature.properties, key)) {
                           popupContent += `<strong>${key}:</strong> ${feature.properties[key]}<br>`;
                        }
                    }
                 }
                 layer.bindPopup(popupContent);
            }
        }); //.addTo(map); // DO NOT add directly to map, add to groups via onEachFeature

        // --- Check if any layers were added and fit bounds ---
         const bounds = L.featureGroup([propertyLayerGroup, appLayerGroup, rlLayerGroup]).getBounds();
         if (bounds.isValid()) {
             map.fitBounds(bounds);
             fileFeedback.textContent = `Sucesso: ${file.name} carregado com camadas.`;
             console.log("Camadas adicionadas aos grupos e limites ajustados."); // Debug
         } else if (geojsonData.features && geojsonData.features.length > 0){
             fileFeedback.textContent = `Aviso: ${file.name} carregado, mas nenhuma camada reconhecida (verifique a propriedade 'tipo' no GeoJSON).`;
             console.warn("GeoJSON carregado, mas sem camadas válidas adicionadas aos grupos."); // Debug
         } else {
              fileFeedback.textContent = `Aviso: Arquivo GeoJSON parece vazio ou inválido.`;
         }


      } catch (error) { /* ... (error handling unchanged) ... */ }
    };

    reader.onerror = function() { /* ... (error handling unchanged) ... */ };

    reader.readAsText(file);
  }


  /**
   * Initializes all charts using data from the currentPropertyData object.
   * (Sem mudanças significativas aqui, mas garantindo que usa currentPropertyData)
   */
  function initializeCharts() {
      if (!currentPropertyData || !currentPropertyData.charts) {
          console.warn("Dados da propriedade ou dos gráficos não encontrados para inicializar charts.");
          // Optionally clear existing charts if needed
          Chart.helpers.each(Chart.instances, (instance) => { instance.destroy(); });
          return;
      }
       console.log("Inicializando gráficos..."); // Debug
      const chartsData = currentPropertyData.charts;

      Chart.helpers.each(Chart.instances, (instance) => { instance.destroy(); });

      // --- Vegetation Charts ---
      if (chartsData.vegetacaoPie && document.getElementById('vegetacaoChart')) { /* ... (código do gráfico) ... */ }
      if (chartsData.vegetacaoBar && document.getElementById('barrasVegetacaoChart')) { /* ... */ }
      // --- Carbono Chart ---
       if (chartsData.carbonoBar && document.getElementById('carbonoChart')) { /* ... */ }
      // --- Hidrico Chart ---
       if (chartsData.hidricoBar && document.getElementById('hidricoChart')) { /* ... */ }
      // --- Clima Chart ---
       const climaChartData = currentPropertyData.clima?.climaChartData;
       if (climaChartData && document.getElementById('climaChart')) { /* ... */ }
      // --- Valoracao Chart ---
       if (chartsData.valoracaoBar && document.getElementById('valoracaoChart')) { /* ... */ }

        console.log("Gráficos inicializados."); // Debug
  }


  // --- Event Listeners ---
  loginButton.addEventListener('click', handleLogin);
  propertyIdInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            handleLogin();
        }
  });

  tabButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        // Garantir que currentPropertyData existe antes de tentar mudar aba (exceto se for o login)
        if(currentPropertyData || e.target.closest('#login-section')) {
           const tabId = button.getAttribute('aria-controls');
           openTab(tabId);
        } else {
            console.warn("Tentativa de mudar de aba sem dados carregados.");
            // Poderia dar um feedback ao usuário aqui
        }
    });
  });

}); // End DOMContentLoaded