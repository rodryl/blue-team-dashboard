Chart.register(ChartDataLabels);


window.appData = () => ({
  abierto: null,
  categorias: {},
  utilidades: {},
  seccion: 'tools',
  filtros: { licencia: '' },
  datosCargados: false,
  guiaActiva: null,
  totalColaboradores: 0,

async init() {
  console.log("Inicializando app...");

  const [resHerramientas, resUtilidades] = await Promise.all([
    fetch('data/herramientas.json'),
    fetch('data/utilidadesblue.json')
  ]);

  this.categorias = await resHerramientas.json();
  this.utilidades = await resUtilidades.json();
  this.datosCargados = true;

  this.$watch('filtros.licencia', () => {
    this.actualizarGraficoHerramientas();
    this.actualizarGraficoUtilidades();
    this.actualizarResumenUtilidades();
    this.actualizarResumenHerramientas();
  });

this.$watch('seccion', (valor) => {
  this.$nextTick(() => {
    setTimeout(() => {
      if (valor === 'utilidades') {
        this.actualizarGraficoUtilidades();
        this.actualizarResumenUtilidades();
      } else if (valor === 'tools') {
        this.actualizarGraficoHerramientas();
        this.actualizarResumenHerramientas();
      } else if (valor === 'ranking') {
        this.generarRankingColaboradores();
        window.scrollTo({ top: 0, behavior: 'instant' }); // Asegura el scroll arriba
      }
    }, 150); // tiempo suficiente para que termine la transición visual
  });
});


  this.$nextTick(() => {
    this.actualizarGraficoHerramientas();
    this.actualizarResumenHerramientas();

    if (this.seccion === 'ranking') {
      this.generarRankingColaboradores(); // ← si ya estás en esa sección al cargar
    }
  });
},

  get herramientasPlanas() {
    return Object.entries(this.categorias)
      .flatMap(([categoria, herramientas]) =>
        herramientas.map(h => ({ ...h, categoria }))
      );
  },

  get categoriasFiltradas() {
    const filtro = this.filtros.licencia?.toLowerCase() || '';
    const resultado = {};
    for (const [cat, herramientas] of Object.entries(this.categorias)) {
      const filtradas = herramientas.filter(h => {
        const licencia = (h.licencia || 'n/d').toLowerCase();
        return !filtro || (filtro === 'n/d' ? licencia === 'n/d' : licencia.includes(filtro));
      });
      if (filtradas.length > 0) resultado[cat] = filtradas;
    }
    return resultado;
  },

  actualizarGraficoHerramientas() {
    const ctx = document.getElementById('chartHerramientas')?.getContext('2d');
    if (!ctx) return;

    const filtroLicencia = this.filtros.licencia.toLowerCase();

    const conteo = Object.entries(this.categorias)
      .map(([cat, herramientas]) => {
        const filtradas = herramientas.filter(h => {
          const licencia = (h.licencia || 'n/d').toLowerCase();
          return !filtroLicencia || (filtroLicencia === 'n/d' ? licencia === 'n/d' : licencia.includes(filtroLicencia));
        });
        return [cat.charAt(0).toUpperCase() + cat.slice(1), filtradas.length];
      })
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1]);

    const labels = conteo.map(([cat]) => cat);
    const data = conteo.map(([, count]) => count);

    if (window.chartInstance) window.chartInstance.destroy();

    window.chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Cantidad de herramientas',
          data,
          backgroundColor: 'rgba(59, 130, 246, 0.6)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1
        }]
      },
      options: {
        indexAxis: 'y',
        plugins: {
          legend: { display: false },
          datalabels: {
            anchor: 'end',
            align: 'left',
            color: '#fff',
            font: { weight: 'bold' },
            formatter(value, context) {
              const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
              return `${value} (${((value / total) * 100).toFixed(1)}%)`;
            }
          }
        },
        scales: {
          x: { beginAtZero: true, ticks: { color: '#ccc' }, grid: { color: '#444' } },
          y: { ticks: { color: '#ccc' }, grid: { color: '#444' } }
        }
      },
      plugins: [ChartDataLabels]
    });
  },

  actualizarResumenHerramientas() {
    const total = Object.values(this.categoriasFiltradas).flat().length;
    const resumenEl = document.getElementById('resumenHerramientas');
    if (resumenEl) {
      resumenEl.innerHTML = `🔹 <strong>Total herramientas:</strong> ${total}`;
    }
  },

  abrirGuia(guias) {
    console.log("Guías recibidas:", guias);
    if (Array.isArray(guias)) {
      this.guiaActiva = guias;
    } else {
      this.guiaActiva = null;
    }
  },

  get utilidadesFiltradas() {
    const filtro = this.filtros.licencia?.toLowerCase() || '';
    const resultado = {};
    for (const [cat, herramientas] of Object.entries(this.utilidades)) {
      const filtradas = herramientas.filter(h => {
        const licencia = (h.licencia || 'n/d').toLowerCase();
        return !filtro || (filtro === 'n/d' ? licencia === 'n/d' : licencia.includes(filtro));
      });
      if (filtradas.length > 0) resultado[cat] = filtradas;
    }
    return resultado;
  },

  actualizarGraficoUtilidades() {
    const ctx = document.getElementById('chartUtilidades')?.getContext('2d');
    if (!ctx) return;

    const conteo = Object.entries(this.utilidadesFiltradas)
      .map(([cat, herramientas]) => [cat.charAt(0).toUpperCase() + cat.slice(1), herramientas.length])
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1]);

    const labels = conteo.map(([cat]) => cat);
    const data = conteo.map(([, count]) => count);

    if (window.chartUtilidadesInstance) window.chartUtilidadesInstance.destroy();

    window.chartUtilidadesInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Cantidad de utilidades',
          data,
          backgroundColor: 'rgba(59, 130, 246, 0.6)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1
        }]
      },
      options: {
        indexAxis: 'y',
        plugins: {
          legend: { display: false },
          datalabels: {
            anchor: 'end',
            align: 'left',
            color: '#fff',
            font: { weight: 'bold' },
            formatter(value, context) {
              const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
              return `${value} (${((value / total) * 100).toFixed(1)}%)`;
            }
          }
        },
        scales: {
          x: { beginAtZero: true, ticks: { color: '#ccc' }, grid: { color: '#444' } },
          y: { ticks: { color: '#ccc' }, grid: { color: '#444' } }
        }
      },
      plugins: [ChartDataLabels]
    });
  },

  get utilidadesFiltradas() {
    const filtro = this.filtros.licencia?.toLowerCase() || '';
    const resultado = {};
    for (const [cat, herramientas] of Object.entries(this.utilidades)) {
      const filtradas = herramientas.filter(h => {
        const licencia = (h.licencia || 'n/d').toLowerCase();
        return !filtro || (filtro === 'n/d' ? licencia === 'n/d' : licencia.includes(filtro));
      });
      if (filtradas.length > 0) resultado[cat] = filtradas;
    }
    return resultado;
  },

  actualizarResumenUtilidades() {
    const total = Object.values(this.utilidadesFiltradas).flat().length;
    const resumenEl = document.getElementById('resumenUtilidades');
    if (resumenEl) {
      resumenEl.innerHTML = `🔹 <strong>Total utilidades:</strong> ${total}`;
    }
  },

  generarRankingColaboradores() {
    const conteo = {};

    const procesarGuias = (categorias) => {
      Object.values(categorias).flat().forEach(herramienta => {
        if (herramienta.guias && Array.isArray(herramienta.guias)) {
          herramienta.guias.forEach(g => {
            const colaborador = g.colaborador || g.autor || 'Desconocido';
            if (!conteo[colaborador]) conteo[colaborador] = 0;
            conteo[colaborador]++;
          });
        }
      });
    };

    procesarGuias(this.categorias);
    procesarGuias(this.utilidades);

    // Ordenar de mayor a menor
    const ranking = Object.entries(conteo)
      .sort((a, b) => b[1] - a[1]);

    const labels = ranking.map(([nombre]) => nombre);
    const data = ranking.map(([, cantidad]) => cantidad);

    this.totalColaboradores = labels.length;

    const ctx = document.getElementById('chartColaboradores')?.getContext('2d');
    if (!ctx) return;

    if (window.chartColaboradores && typeof window.chartColaboradores.destroy === 'function') {
      window.chartColaboradores.destroy();
    }


    window.chartColaboradores = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Guías publicadas',
          data,
          backgroundColor: 'rgba(59, 130, 246, 0.6)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1
        }]
      },
      options: {
        indexAxis: 'y',
        plugins: {
          legend: { display: false },
          datalabels: {
            anchor: 'end',
            align: 'left',
            color: '#fff',
            font: { weight: 'bold' },
            formatter: value => `${value} guías`
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: { color: '#ccc' },
            grid: { color: '#444' }
          },
          y: {
            ticks: { color: '#ccc' },
            grid: { color: '#444' }
          }
        }
      },
      plugins: [ChartDataLabels]
    });
  }


  

});
