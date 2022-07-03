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
const areaChart = (graf, data, yAccessor, xAccessor, metric, xText, yText) => {
  //Marges entre grafica y contenedor
  const margins = {
    top: 70,
    right: 30,
    bottom: 60,
    left: 100,
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
  } else {
    svg
      .attr('width', anchoTotal)
      .attr('height', altoTotal)
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
  } else {
    background
      .attr("height", alto)
      .attr("width", ancho)
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

  // Duracion de transiones
  const durationTransition = 2000

  // Escala de colores para que sean distintos por metrica
  const color = d3
    .scaleOrdinal()
    .domain(d3.selectAll('#metric option').nodes().map(o => o.value))
    .range(['#1982c4', '#FF595E', '#6a4c93'])

  // Linea
  const line = g.selectAll('.line').data([data])
  
  line
    .enter()
    .append("path")
    .attr('class', 'line')
    .merge(line)
    .attr("fill", "none")
    .attr("stroke-width", 2)
    .transition()
    .attr("stroke", color(metric.value))
    .duration(durationTransition)
    .attrTween('d', function (data) {
      let previous = d3.select(this).attr('d')
      let current = d3.line()
        .x( (d) => x(xAccessor(d)) )
        .y( (d) => y(yAccessor(d)) )
        (data)
      return d3.interpolatePath(previous, current)
    })

  // Area
  const area = g.selectAll('.area').data([data], xAccessor)

  area
    .enter()
    .append('path')
    .attr('class', 'area')
    .merge(area)
    .transition()
    .duration(durationTransition)
    .attr('fill', color(metric.value))
    .attr('opacity', '0.1')
    .attrTween('d', function (data) {
      let previous = d3.select(this).attr('d')
      let current = d3.area()
        .x( (d) => x(xAccessor(d)) )
        .y0( alto )
        .y1( (d) => y(yAccessor(d)) )
        (data)
      let excludeSegment = (a, b) => a.x === b.x && a.x === ancho;

      return d3.interpolatePath(previous, current, excludeSegment)
    })

  // Puntos con tooltip
  g
    .selectAll("circle")
    .data(data)
    .join('circle')
    .on("mouseover", function (event, d) {
      let tooltip = d3.select('#tooltip')

      tooltip
        .transition()
        .duration(200)
        .style("opacity", 1);
      
      tooltip
        .html('Año: ' + xAccessor(d).getFullYear() +'<br>Valor: ' + new Intl.NumberFormat().format(yAccessor(d).toFixed(0)))
        .style("left",  (event.pageX) + "px")
        .style("top", (event.pageY) + "px");
    })
    .on("mouseout", function (d) {
      let tooltip = d3.select('#tooltip')

      tooltip.transition()
        .duration(200)
        .style("opacity", 0);
    })
    .attr("r", 15)
    .attr("cx", (d) => x(xAccessor(d)))
    .attr("cy", (d) => y(yAccessor(d)))
    .attr("opacity", "0")

  // Títulos
  let title = svg.select('#title')

  if (title.empty()) {
    title = svg.append("text")
      .attr('id', 'title')
      .attr("y", 40)
  }

  title
    .text(metric.text)
    .transition()
    .duration(durationTransition)
    .attr("x", margins.left + (ancho / 2))

  // Etiquetas de eje X
  let xAxisGroup = g.select('#xAxisGroup')

  if (xAxisGroup.empty()) {
    xAxisGroup = g.append("g")
      .attr('id', 'xAxisGroup')
  }

  xAxisGroup
    .attr("transform", `translate(0, ${alto})`)
    .transition()
    .duration(durationTransition)
    .call(d3.axisBottom(x).ticks(8))

  let xLegend = svg.select('#xLegend')

  if (xLegend.empty()) {
    xLegend = svg.append("text")
      .attr('id', 'xLegend')
  }

  xLegend
    .text(xText)
    .attr('y', altoTotal - 10 )
    .transition()
    .duration(durationTransition)
    .attr('x', margins.left + (ancho / 2))

  // Etiquetas de eje y
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

  let yLegend = svg.select('#yLegend')

  if (yLegend.empty()) {
    yLegend = svg.append("text")
      .attr('id', 'yLegend')
      .attr('x', 25)
  }

  yLegend
    .text(yText)
    .transition()
    .duration(durationTransition)
    .attr('y', margins.top + (alto / 2))
    .style('transform-origin', `${25}px ${margins.top + (alto / 2)}px`)
    .style('transform', 'rotate(-90deg)')
}

const draw = async () => {
  // Opcion seleccionada
  const metric = {
    value: d3.select('#metric').property('value'),
    text: d3.select('#metric option:checked').text()
  }

  // Definiciones
  const graf = d3.select("#graf")
  let yAccessor = (d) => d['Valor']
  let xAccessor = (d) => d['Fecha']
  let data
  let xtext = "Año"
  let yText 

  switch (metric.value) {
    case 'PIB':
      // Cargar informacion PIB 
      let pib = await d3.json("data/deuda_en_relacion_al_pib.json")
      
      pib  = pib.Respuesta.Datos.Metricas[1]
      yText = `${pib.Escala} de ${pib.Unidad.split(" ")[0]}`
      data = pib.Datos

      // Cambiar trimestres a fecha
      data.forEach((d) => {
        d.Fecha = dateQuarter(d['Periodo'], d['Agno'])
      })
      break
    case 'DEU':
      // Cargar informacion Deuda 
      let deuda = await d3.json("data/deuda_en_relacion_al_pib.json")

      deuda  = deuda.Respuesta.Datos.Metricas[0]
      yText = `${deuda.Escala} de ${deuda.Unidad.split(" ")[0]}`
      data = deuda.Datos

      // Cambiar trimestres a fecha
      data.forEach((d) => {
        d.Fecha = dateMonth(d['Periodo'], d['Agno'])
      })
      break
    case 'DES':
      // Cargar informacion PIB 
      let parados = await d3.json("data/numero_de_parados.json")

      parados  = parados.Respuesta.Datos.Metricas[0]
      yText = `${parados.Escala} de ${parados.Unidad.split(" ")[0]}`
      data = parados.Datos

      // Cambiar trimestres a fecha
      data.forEach((d) => {
        d.Fecha = dateQuarter(d['Periodo'], d['Agno'])
      })
      break
  }

  // Graficar
  areaChart(graf, data, yAccessor, xAccessor, metric, xtext, yText)
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

      draw()
    })

  // Adaptar grafica al redimensionar navegador
  let resizeTimer;

  d3.select(window)
    .on('resize', () => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => {
        draw()
      }, 250)
    })
}

init()
draw()