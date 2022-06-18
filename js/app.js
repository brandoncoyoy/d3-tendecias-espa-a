// Obtener fecha a partir de trimestre
const dateQuarter = (quarter, year) => {
  const quarters = {
    "Trimestre 1": {
      day: 31,
      month: 3
    },
    "Trimestre 2": {
      day: 30,
      month: 6
    },
    "Trimestre 3": {
      day: 30,
      month: 9
    },
    "Trimestre 4": {
      day: 31,
      month: 12
    }
  }

  return new Date(year, quarters[quarter].month - 1, quarters[quarter].day)
}

// Obtener fecha a partir de mes y año
const dateMonth = (month, year) => {
  const months = {
    'Marzo': {
      day: 31,
      month: 3
    },
    "Junio": {
      day: 30,
      month: 6
    },
    "Septiembre": {
      day: 30,
      month: 9
    },
    "Diciembre": {
      day: 31,
      month: 12
    }
  }

  return new Date(year, months[month].month - 1, months[month].day)
}

// Dibujar gráfica de lineal
const lineChart = (graf, data, yAccessor, xAccessor, titulo) => {
  //Marges entre grafica y contenedor
  const margins = {
    top: 50,
    right: 20,
    bottom: 50,
    left: 80,
  }

  // Dimensiones
  const anchoTotal = +graf.style("width").slice(0, -2)
  const altoTotal = (anchoTotal * 9) / 16
  const ancho = anchoTotal - margins.left - margins.right
  const alto = altoTotal - margins.top - margins.bottom

  // Lienzo
  let svg = graf.select('svg')

  if (svg.empty()) {
    svg = graf
      .append("svg")
      .attr("width", anchoTotal)
      .attr("height", altoTotal)
      .attr("class", "graf")
  }

  // Fondo de gráfica
  let groupBackground = svg.select('#groupBackground')

  if (groupBackground.empty()) {
    groupBackground = svg
      .append("g")
      .attr('id', 'groupBackground')
      .attr("transform", `translate(${margins.left}, ${margins.top})`)
  }

  let background = groupBackground.select('#background')
  
  if (background.empty()) {
    background = groupBackground
      .append("rect")
      .attr('id', 'background')
      .attr("height", alto)
      .attr("width", ancho)
      .attr("fill", "white")
  }

  // Grupo principal
  let g = svg.select('#plot')

  if (g.empty()) {
    g = svg
      .append("g")
      .attr('id', 'plot')
      .attr("transform", `translate(${margins.left}, ${margins.top})`)
  }

  // Escaladores
  const y = d3
    .scaleLinear()
    .domain([0, d3.max(data, yAccessor)])
    .range([alto, 0])

  const x = d3
    .scaleTime()
    .domain(d3.extent(data, xAccessor))
    .range([0, ancho])

  // Linea
  const line = g.selectAll('.line').data([data], xAccessor)

  line
    .enter()
    .append("path")
    .attr('class', 'line')
    .merge(line)
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 2)
    .attr("d", d3.line()
      .x( (d) => x(xAccessor(d)) )
      .y(alto))
    .transition()
    .duration(2000)
    .attr("d", d3.line()
      .x( (d) => x(xAccessor(d)) )
      .y( (d) => y(yAccessor(d)) ))

  // Area
  const area = g.selectAll('.area').data([data], xAccessor)

  area
    .enter()
    .append('path')
    .attr('class', 'area')
    .merge(area)
    .attr('fill', 'lightsteelblue')
    .attr('opacity', '0.3')
    .attr('d', d3.area()
      .x( (d) => x(xAccessor(d)) )
      .y0(alto)
      .y1(alto))
    .transition()
    .duration(2000)
    .attr('d', d3.area()
      .x( (d) => x(xAccessor(d)) )
      .y0(alto)
      .y1( (d) => y(yAccessor(d)) ))

  // Títulos
  let title = svg.select('#title')

  if (title.empty()) {
    title =  svg.append("text")
      .attr('id', 'title')
      .attr("x", anchoTotal / 2)
      .attr("y", 30)
      .classed("titulo", true)
  }
 
  title.text(titulo)

  // Etiquetas de ejes
  let xAxisGroup = g.select('#xAxisGroup')

  if (xAxisGroup.empty()) {
    xAxisGroup = g.append("g")
      .attr('id', 'xAxisGroup')
      .attr("transform", `translate(0, ${alto})`)
  }

  xAxisGroup
    .transition()
    .duration(2000)
    .call(d3.axisBottom(x).ticks(8))
  
  let yAxisGroup = g.select('#yAxisGroup')

  if (yAxisGroup.empty()) {
    yAxisGroup = g
      .append('g')
      .attr('id', 'yAxisGroup')
  }
  
  yAxisGroup
    .transition()
    .duration(2000)
    .call(d3.axisLeft(y).ticks(8))
}

const draw = async (metric) => {
  // Selecciones
  const graf = d3.select("#graf")
  let yAccessor;
  let xAccessor;

  switch(metric.value) {
    case 'PIB':
        // Cargar informacion PIB 
        let pib = await d3.json("data/deuda_en_relacion_al_pib.json")
        pib = pib.Respuesta.Datos.Metricas[1].Datos
        
        // Cambiar trimestres a fecha
        pib.forEach((d) => {
          d.Fecha = dateQuarter(d['Periodo'], d['Agno'])
        })

        // Funciones de acceso
        yAccessor = (d) => d['Valor']
        xAccessor = (d) => d['Fecha']

        // Graficar
        lineChart(graf, pib, yAccessor, xAccessor, metric.text)
      break
    case 'DEU':
         // Cargar informacion Deuda 
         let deuda = await d3.json("data/deuda_en_relacion_al_pib.json")
         deuda = deuda.Respuesta.Datos.Metricas[0].Datos
         
         // Cambiar trimestres a fecha
         deuda.forEach((d) => {
           d.Fecha = dateMonth(d['Periodo'], d['Agno'])
         })
 
         // Funciones de acceso
         yAccessor = (d) => d['Valor']
         xAccessor = (d) => d['Fecha']
 
         // Graficar
         lineChart(graf, deuda, yAccessor, xAccessor, metric.text)
      break
    case 'DES':
         // Cargar informacion PIB 
         let parados = await d3.json("data/numero_de_parados.json")
         parados = parados.Respuesta.Datos.Metricas[0].Datos
         
         // Cambiar trimestres a fecha
         parados.forEach((d) => {
           d.Fecha = dateQuarter(d['Periodo'], d['Agno'])
         })
 
         // Funciones de acceso
         yAccessor = (d) => d['Valor']
         xAccessor = (d) => d['Fecha']
 
         // Graficar
         lineChart(graf, parados, yAccessor, xAccessor, metric.text)
      break
  }
}

const init = () => {
  // Llenar lista de opciones y configurar evento
  const metric = d3.select("#metric")
  const options = [
    {
      text: 'Producto Interno Bruto',
      value: 'PIB'
    },
    {
      text: 'Deuda Pública',
      value: 'DEU'
    },
    {
      text: 'Desempleados',
      value: 'DES'
    }
  ]

  metric
    .selectAll('option')
    .data(options)
    .enter()
    .append('option')
    .attr('value', (d) => d.value)
    .text((d) => d.text)
  
  metric
    .on('change', (event) => {
      event.preventDefault()

      draw(
        {     
          value: event.target.value,
          text: event.target.options[event.target.options.selectedIndex].label
        }
      )
    })
}

init()
draw( 
  {     
    value: d3.select('#metric').property('value'),
    text: d3.select('#metric option:checked').text()
  }
)